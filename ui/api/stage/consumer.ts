/**
 * Consumer management for stage media streaming
 * Handles remote media streams from other participants
 */
import { getState, getRecvTransport, setRecvTransport, findConsumer, addConsumer, removeConsumer, getConsumersByPeer } from "./state";
import { stageClient } from "../_trpcClient";
import { sleep } from "./utils";
import { createTransport } from "./transport";
import type { Consumer, MediaTag } from "./types";
import type { CustomAppData } from "~/types/serverSideTypes";

/**
 * Subscribe to a remote peer's media track
 * @param peerId - ID of the peer to subscribe to
 * @param mediaTag - Type of media to subscribe to (video/audio)
 */
export async function subscribeToTrack(peerId: string, mediaTag: MediaTag): Promise<void> {
	console.log(`[Stage] Subscribing to ${peerId}'s ${mediaTag}`);

	let transport = getRecvTransport(peerId);

	// Create a receive transport for this peer if we don't have one
	if (!transport) {
		console.log(`[Stage] Creating receive transport for peer ${peerId}`);
		transport = await createTransport("recv", peerId);
		setRecvTransport(peerId, transport);
	}

	// Check if we already have a consumer for this track
	const existingConsumer = findConsumer(peerId, mediaTag);
	if (existingConsumer) {
		console.log(`[Stage] Already have consumer for ${peerId}'s ${mediaTag}`);
		return;
	}

	// Request consumer parameters from server
	const state = getState();
	if (!state.device) {
		throw new Error("MediaSoup device not initialized");
	}

	const consumerParameters = await stageClient.consume.mutate({
		mediaPeerId: peerId,
		mediaTag,
		rtpCapabilities: state.device.rtpCapabilities,
	});

	if (!consumerParameters) {
		console.warn(`[Stage] No consumer parameters received for ${peerId}'s ${mediaTag}`);
		return;
	}

	// Create the consumer
	const consumer = await transport.consume({
		...consumerParameters,
		appData: consumerParameters.appData as CustomAppData,
	});

	// Add to consumers store
	addConsumer(consumer);

	// Handle connection state changes with retry logic
	let connectionAttempts = 0;
	const maxAttempts = 3;

	consumer.on("transportclose", () => {
		console.log(`[Stage] Transport closed for consumer ${consumer.id}`);
		// Remove consumer from store
		removeConsumer(consumer.id);
	});

	consumer.on("connectionstatechange", async (state) => {
		console.log(`[Stage] Consumer ${consumer.id} connection state changed to: ${state}`);

		if (state === "failed" && connectionAttempts < maxAttempts) {
			connectionAttempts++;
			console.log(`[Stage] Consumer connection failed, retry attempt ${connectionAttempts}/${maxAttempts}`);

			// Wait before retrying
			await sleep(1000 * connectionAttempts);

			// Try to restart ICE
			try {
				await transport.restartIce({ iceParameters: transport.iceParameters });
			} catch (error) {
				console.error("[Stage] Failed to restart ICE:", error);
			}
		}
	});

	console.log(`[Stage] Successfully subscribed to ${peerId}'s ${mediaTag}`);
}

/**
 * Unsubscribe from a remote peer's media track
 * @param peerId - ID of the peer to unsubscribe from
 * @param mediaTag - Type of media to unsubscribe from (video/audio)
 */
export async function unsubscribeFromTrack(peerId: string, mediaTag: MediaTag): Promise<void> {
	const consumer = findConsumer(peerId, mediaTag);
	if (consumer) {
		await closeConsumer(consumer);
		console.log(`[Stage] Unsubscribed from ${peerId}'s ${mediaTag}`);
	}
}

/**
 * Close a consumer and clean up resources
 * @param consumer - Consumer to close
 */
export async function closeConsumer(consumer: Consumer): Promise<void> {
	console.log(`[Stage] Closing consumer ${consumer.id}`);

	// Remove from store first
	removeConsumer(consumer.id);

	// Close the consumer
	consumer.close();

	// Notify server
	try {
		await stageClient.closeConsumer.mutate({ consumerId: consumer.id });
	} catch (error) {
		console.error(`[Stage] Error closing consumer on server:`, error);
	}

	// Check if we should close the transport
	const peerId = consumer.appData.peerId as string;
	const remainingConsumers = getConsumersByPeer(peerId);

	if (remainingConsumers.length === 0) {
		const transport = getRecvTransport(peerId);

		if (transport) {
			console.log(`[Stage] Closing receive transport for peer ${peerId} (no more consumers)`);
			transport.close();
			setRecvTransport(peerId, null);
		}
	}
}
