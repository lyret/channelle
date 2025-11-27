/**
 * Transport management for stage media streaming
 * Handles WebRTC transport creation and lifecycle
 */
import * as MediaSoup from "mediasoup-client";
import { getState, setSendTransport, setRecvTransport, setVideoProducer, setAudioProducer, updateConsumers, getConsumersByPeer } from "./state";
import { stageClient } from "../_trpcClient";
import type { Transport, TransportDirection, CustomAppData } from "./types";

/**
 * Create a WebRTC transport for sending or receiving media
 * @param direction - Transport direction (send/recv)
 * @param peerId - Optional peer ID for receive transports
 * @returns Created transport
 */
export async function createTransport(direction: TransportDirection, peerId?: string): Promise<Transport> {
	console.log(`[Stage] Creating ${direction} transport${peerId ? ` for peer ${peerId}` : ""}`);

	const state = getState();
	if (!state.device) {
		throw new Error("MediaSoup device not initialized");
	}

	// Check if transport already exists
	if (direction === "send" && state.sendTransport) {
		console.log("[Stage] Send transport already exists");
		return state.sendTransport;
	}

	let transport: Transport;
	const transportOptions = await stageClient.createWebRtcTransport.mutate({ direction });

	if (direction === "send") {
		transport = await state.device.createSendTransport(transportOptions);
	} else {
		transport = await state.device.createRecvTransport(transportOptions);
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
		setSendTransport(transport);
	} else {
		// For receive transports, store by peer ID
		if (peerId) {
			setRecvTransport(peerId, transport);
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
		setSendTransport(null);
		setVideoProducer(null);
		setAudioProducer(null);
	} else {
		// Find and remove the failed receive transport
		const state = getState();
		const peerId = Object.keys(state.recvTransports).find((id) => state.recvTransports[id] === transport);

		if (peerId) {
			// Remove associated consumers
			const peerConsumers = getConsumersByPeer(peerId);

			peerConsumers.forEach((consumer) => {
				consumer.close();
			});

			// Update consumers store
			updateConsumers((consumers) => consumers.filter((c) => c.appData.peerId !== peerId));

			// Remove transport
			setRecvTransport(peerId, null);
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
		const state = getState();
		const videoProducer = state.videoProducer;
		const audioProducer = state.audioProducer;

		if (videoProducer && !videoProducer.closed) {
			videoProducer.close();
		}
		if (audioProducer && !audioProducer.closed) {
			audioProducer.close();
		}

		setSendTransport(null);
		setVideoProducer(null);
		setAudioProducer(null);
	} else {
		// Handle receive transport closure
		const state = getState();
		const peerId = Object.keys(state.recvTransports).find((id) => state.recvTransports[id] === transport);

		if (peerId) {
			// Close all consumers for this peer
			const peerConsumers = getConsumersByPeer(peerId);

			peerConsumers.forEach((consumer) => {
				if (!consumer.closed) {
					consumer.close();
				}
			});

			// Update stores
			updateConsumers((consumers) => consumers.filter((c) => c.appData.peerId !== peerId));
			setRecvTransport(peerId, null);
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
		setSendTransport(null);
		setVideoProducer(null);
		setAudioProducer(null);
	} else {
		// Find and remove from receive transports
		const state = getState();
		const peerId = Object.keys(state.recvTransports).find((id) => state.recvTransports[id] === transport);

		if (peerId) {
			setRecvTransport(peerId, null);
		}
	}
}
