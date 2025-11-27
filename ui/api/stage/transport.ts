/**
 * Transport management for stage media streaming
 * Handles WebRTC transport creation and lifecycle
 */
import { get } from "svelte/store";
import * as MediaSoup from "mediasoup-client";
import { deviceStore, sendTransportStore, recvTransports, videoProducerStore, audioProducerStore, consumersStore } from "./stores";
import { stageClient } from "../_trpcClient";
import type { Transport, Device, TransportDirection, CustomAppData, MediaTag } from "./types";

/**
 * Create a WebRTC transport for sending or receiving media
 * @param direction - Transport direction (send/recv)
 * @param peerId - Optional peer ID for receive transports
 * @returns Created transport
 */
export async function createTransport(direction: TransportDirection, peerId?: string): Promise<Transport> {
	console.log(`[Stage] Creating ${direction} transport${peerId ? ` for peer ${peerId}` : ""}`);

	const device = get(deviceStore);
	if (!device) {
		throw new Error("MediaSoup device not initialized");
	}

	// Check if transport already exists
	if (direction === "send" && get(sendTransportStore)) {
		console.log("[Stage] Send transport already exists");
		return get(sendTransportStore)!;
	}

	let transport: Transport;
	const transportOptions = await stageClient.createWebRtcTransport.mutate({ direction });

	if (direction === "send") {
		transport = await device.createSendTransport(transportOptions);
	} else {
		transport = await device.createRecvTransport(transportOptions);
	}

	// Set up transport event handlers
	setupTransportEventHandlers(transport, direction);

	// Connect handler
	transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
		console.log(`[Stage] Transport ${transport.id} connecting`);
		try {
			await stageClient.connectWebRtcTransport.mutate({
				transportId: transport.id,
				dtlsParameters,
			});
			callback();
		} catch (error) {
			console.error(`[Stage] Failed to connect transport:`, error);
			errback(error as Error);
		}
	});

	// Produce handler (only for send transport)
	if (direction === "send") {
		transport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
			console.log(`[Stage] Transport producing ${kind}`);
			let paused = false;

			// Check if we should start paused
			if (appData?.mediaTag === "video" && kind === "video") {
				// Video specific logic if needed
			} else if (appData?.mediaTag === "audio" && kind === "audio") {
				// Audio specific logic if needed
			}

			try {
				const { producerId } = await stageClient.produce.mutate({
					transportId: transport.id,
					kind,
					rtpParameters,
					paused,
					appData: appData as CustomAppData,
				});

				callback({ id: producerId });
			} catch (error) {
				console.error(`[Stage] Failed to produce:`, error);
				errback(error as Error);
			}
		});

		// Store the send transport
		sendTransportStore.set(transport);
	} else {
		// For receive transports, store by peer ID
		if (peerId) {
			recvTransports.update(transports => ({
				...transports,
				[peerId]: transport
			}));
		}
	}

	return transport;
}

/**
 * Set up event handlers for a transport
 * @param transport - Transport to set up handlers for
 * @param direction - Transport direction
 */
function setupTransportEventHandlers(transport: Transport, direction: TransportDirection): void {
	// Connection state change handler
	transport.on("connectionstatechange", (state) => {
		console.log(`[Stage] Transport ${transport.id} connection state changed to: ${state}`);

		switch (state) {
			case "connected":
				console.log(`[Stage] Transport ${transport.id} connected successfully`);
				break;
			case "connecting":
				console.log(`[Stage] Transport ${transport.id} is connecting...`);
				break;
			case "failed":
				console.error(`[Stage] Transport ${transport.id} connection failed`);
				handleTransportFailure(transport, direction);
				break;
			case "disconnected":
				console.warn(`[Stage] Transport ${transport.id} disconnected`);
				break;
			case "closed":
				console.log(`[Stage] Transport ${transport.id} closed`);
				handleTransportClosed(transport, direction);
				break;
		}
	});

	// ICE gathering state change
	transport.on("icegatheringstatechange", (state) => {
		console.log(`[Stage] Transport ${transport.id} ICE gathering state: ${state}`);
	});

	// ICE connection state change
	if ("iceConnectionState" in transport) {
		transport.on("iceconnectionstatechange", (state) => {
			console.log(`[Stage] Transport ${transport.id} ICE connection state: ${state}`);
		});
	}
}

/**
 * Handle transport failure
 * @param transport - Failed transport
 * @param direction - Transport direction
 */
function handleTransportFailure(transport: Transport, direction: TransportDirection): void {
	console.error(`[Stage] Handling ${direction} transport failure`);

	if (direction === "send") {
		// Clear send transport and producers
		sendTransportStore.set(null);
		videoProducerStore.set(null);
		audioProducerStore.set(null);
	} else {
		// Find and remove the failed receive transport
		const transports = get(recvTransports);
		const peerId = Object.keys(transports).find(id => transports[id] === transport);

		if (peerId) {
			// Remove associated consumers
			const consumers = get(consumersStore);
			const peerConsumers = consumers.filter(c => c.appData.peerId === peerId);

			peerConsumers.forEach(consumer => {
				consumer.close();
			});

			// Update consumers store
			consumersStore.update(consumers =>
				consumers.filter(c => c.appData.peerId !== peerId)
			);

			// Remove transport
			recvTransports.update(transports => {
				const updated = { ...transports };
				delete updated[peerId];
				return updated;
			});
		}
	}
}

/**
 * Handle transport closed event
 * @param transport - Closed transport
 * @param direction - Transport direction
 */
function handleTransportClosed(transport: Transport, direction: TransportDirection): void {
	console.log(`[Stage] Handling ${direction} transport closed`);

	if (direction === "send") {
		// Clear send transport and producers
		const videoProducer = get(videoProducerStore);
		const audioProducer = get(audioProducerStore);

		if (videoProducer && !videoProducer.closed) {
			videoProducer.close();
		}
		if (audioProducer && !audioProducer.closed) {
			audioProducer.close();
		}

		sendTransportStore.set(null);
		videoProducerStore.set(null);
		audioProducerStore.set(null);
	} else {
		// Handle receive transport closure
		const transports = get(recvTransports);
		const peerId = Object.keys(transports).find(id => transports[id] === transport);

		if (peerId) {
			// Close all consumers for this peer
			const consumers = get(consumersStore);
			const peerConsumers = consumers.filter(c => c.appData.peerId === peerId);

			peerConsumers.forEach(consumer => {
				if (!consumer.closed) {
					consumer.close();
				}
			});

			// Update stores
			consumersStore.update(consumers =>
				consumers.filter(c => c.appData.peerId !== peerId)
			);

			recvTransports.update(transports => {
				const updated = { ...transports };
				delete updated[peerId];
				return updated;
			});
		}
	}
}

/**
 * Close a transport and clean up resources
 * @param transport - Transport to close
 * @param direction - Transport direction
 */
export async function closeTransport(transport: Transport, direction: TransportDirection): Promise<void> {
	console.log(`[Stage] Closing ${direction} transport ${transport.id}`);

	try {
		// Notify server
		await stageClient.closeTransport.mutate({ transportId: transport.id });
	} catch (error) {
		console.error(`[Stage] Error closing transport on server:`, error);
	}

	// Close the transport locally
	transport.close();

	// Update stores
	if (direction === "send") {
		sendTransportStore.set(null);
		videoProducerStore.set(null);
		audioProducerStore.set(null);
	} else {
		// Find and remove from receive transports
		const transports = get(recvTransports);
		const peerId = Object.keys(transports).find(id => transports[id] === transport);

		if (peerId) {
			recvTransports.update(transports => {
				const updated = { ...transports };
				delete updated[peerId];
				return updated;
			});
		}
	}
}

/**
 * Get transport statistics
 * @param transport - Transport to get stats for
 * @returns Transport statistics
 */
export async function getTransportStats(transport: Transport): Promise<RTCStatsReport | null> {
	try {
		const stats = await transport.getStats();
		return stats;
	} catch (error) {
		console.error(`[Stage] Error getting transport stats:`, error);
		return null;
	}
}

/**
 * Restart ICE for a transport
 * @param transport - Transport to restart ICE for
 */
export async function restartTransportIce(transport: Transport): Promise<void> {
	console.log(`[Stage] Restarting ICE for transport ${transport.id}`);

	try {
		const iceParameters = await stageClient.restartIce.mutate({
			transportId: transport.id
		});

		await transport.restartIce({ iceParameters });
		console.log(`[Stage] ICE restarted successfully for transport ${transport.id}`);
	} catch (error) {
		console.error(`[Stage] Failed to restart ICE:`, error);
		throw error;
	}
}
