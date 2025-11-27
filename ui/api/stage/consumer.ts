/**
 * Consumer management for stage media streaming
 * Handles remote media streams from other participants
 */
import { get } from "svelte/store";
import * as MediaSoup from "mediasoup-client";
import { consumersStore, recvTransports, deviceStore } from "./stores";
import { stageClient } from "../_trpcClient";
import { findConsumerForTrack, sleep } from "./utils";
import { createTransport } from "./transport";
import type { Consumer, Transport, MediaTag } from "./types";
import type { CustomAppData } from "~/types/serverSideTypes";

/**
 * Subscribe to a remote peer's media track
 * @param peerId - ID of the peer to subscribe to
 * @param mediaTag - Type of media to subscribe to (video/audio)
 */
export async function subscribeToTrack(peerId: string, mediaTag: MediaTag): Promise<void> {
	console.log(`[Stage] Subscribing to ${peerId}'s ${mediaTag}`);

	const transports = get(recvTransports);
	let transport = transports[peerId];

	// Create a receive transport for this peer if we don't have one
	if (!transport) {
		console.log(`[Stage] Creating receive transport for peer ${peerId}`);
		transport = await createTransport("recv", peerId);
		recvTransports.update((t) => ({ ...t, [peerId]: transport }));
	}

	// Check if we already have a consumer for this track
	const existingConsumer = findConsumerForTrack(peerId, mediaTag);
	if (existingConsumer) {
		console.log(`[Stage] Already have consumer for ${peerId}'s ${mediaTag}`);
		return;
	}

	// Request consumer parameters from server
	const device = get(deviceStore);
	if (!device) {
		throw new Error("MediaSoup device not initialized");
	}

	const consumerParameters = await stageClient.consume.mutate({
		mediaPeerId: peerId,
		mediaTag,
		rtpCapabilities: device.rtpCapabilities,
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
	consumersStore.update((consumers) => [...consumers, consumer]);

	// Handle connection state changes with retry logic
	let connectionAttempts = 0;
	const maxAttempts = 3;

	consumer.on("transportclose", () => {
		console.log(`[Stage] Transport closed for consumer ${consumer.id}`);
		// Remove consumer from store
		consumersStore.update((consumers) => consumers.filter((c) => c.id !== consumer.id));
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
	const consumer = findConsumerForTrack(peerId, mediaTag);
	if (consumer) {
		await closeConsumer(consumer);
		console.log(`[Stage] Unsubscribed from ${peerId}'s ${mediaTag}`);
	}
}

/**
 * Pause a consumer (stop receiving media)
 * @param consumer - Consumer to pause
 */
export async function pauseConsumer(consumer: Consumer): Promise<void> {
	console.log(`[Stage] Pausing consumer ${consumer.id}`);
	await consumer.pause();
	await stageClient.pauseConsumer.mutate({ consumerId: consumer.id });
}

/**
 * Resume a consumer (start receiving media)
 * @param consumer - Consumer to resume
 */
export async function resumeConsumer(consumer: Consumer): Promise<void> {
	console.log(`[Stage] Resuming consumer ${consumer.id}`);
	await consumer.resume();
	await stageClient.resumeConsumer.mutate({ consumerId: consumer.id });
}

/**
 * Close a consumer and clean up resources
 * @param consumer - Consumer to close
 */
export async function closeConsumer(consumer: Consumer): Promise<void> {
	console.log(`[Stage] Closing consumer ${consumer.id}`);

	// Remove from store first
	consumersStore.update((consumers) => consumers.filter((c) => c.id !== consumer.id));

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
	const remainingConsumers = get(consumersStore).filter((c) => c.appData.peerId === peerId);

	if (remainingConsumers.length === 0) {
		const transports = get(recvTransports);
		const transport = transports[peerId];

		if (transport) {
			console.log(`[Stage] Closing receive transport for peer ${peerId} (no more consumers)`);
			transport.close();
			recvTransports.update((t) => {
				const updated = { ...t };
				delete updated[peerId];
				return updated;
			});
		}
	}
}

/**
 * Pause all active consumers
 */
export async function pauseAllConsumers(): Promise<void> {
	console.log("[Stage] Pausing all consumers");
	const consumers = get(consumersStore);

	await Promise.all(
		consumers.filter((c) => !c.paused).map((consumer) => pauseConsumer(consumer))
	);
}

/**
 * Resume all paused consumers
 */
export async function resumeAllConsumers(): Promise<void> {
	console.log("[Stage] Resuming all consumers");
	const consumers = get(consumersStore);

	await Promise.all(
		consumers.filter((c) => c.paused).map((consumer) => resumeConsumer(consumer))
	);
}

/**
 * Close all consumers and clean up
 */
export async function closeAllConsumers(): Promise<void> {
	console.log("[Stage] Closing all consumers");
	const consumers = get(consumersStore);

	// Close all consumers
	await Promise.all(consumers.map((consumer) => closeConsumer(consumer)));

	// Clear the store
	consumersStore.set([]);
}

/**
 * Pause a producer on the server
 * @param producer - Producer to pause
 */
export async function pauseProducer(producer: MediaSoup.types.Producer): Promise<void> {
	console.log(`[Stage] Pausing producer ${producer.id}`);
	await producer.pause();
	await stageClient.pauseProducer.mutate({ producerId: producer.id });
}

/**
 * Resume a producer on the server
 * @param producer - Producer to resume
 */
export async function resumeProducer(producer: MediaSoup.types.Producer): Promise<void> {
	console.log(`[Stage] Resuming producer ${producer.id}`);
	await producer.resume();

	// Notify server
	try {
		await stageClient.resumeProducer.mutate({ producerId: producer.id });
	} catch (error) {
		console.error(`[Stage] Error resuming producer on server:`, error);
		// Try to recover by pausing and resuming
		await producer.pause();
		await producer.resume();
	}
}
