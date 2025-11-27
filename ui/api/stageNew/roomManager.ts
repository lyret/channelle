/**
 * Simplified Room Manager for Stage
 * Handles all media room events from the unified room subscription
 */
import * as MediaSoup from "mediasoup-client";
import { writable, derived, get } from "svelte/store";
import { stageClient, wsPeerIdStore } from "../_trpcClient";
import type { Transport, Consumer, Producer, Device } from "mediasoup-client/lib/types";
import type { CustomAppData, MediaTag, ActiveSpeaker, MediaSession } from "~/types/serverSideTypes";

// ============================================================================
// TYPES
// ============================================================================

interface RoomState {
	// Connection state
	isConnected: boolean;
	isLoading: boolean;
	error: string | null;

	// MediaSoup
	device: Device | null;

	// Sessions & peers
	sessions: Record<string, MediaSession>;

	// Local media
	localStream: MediaStream | null;
	camEnabled: boolean;
	micEnabled: boolean;

	// Transports
	sendTransport: Transport | null;
	recvTransports: Map<string, Transport>;

	// Producers & Consumers
	producers: Map<string, Producer>;
	consumers: Map<string, Consumer>;

	// Active speaker
	activeSpeaker: ActiveSpeaker | null;
}

// ============================================================================
// STATE
// ============================================================================

const roomState = writable<RoomState>({
	isConnected: false,
	isLoading: false,
	error: null,
	device: null,
	sessions: {},
	localStream: null,
	camEnabled: false,
	micEnabled: false,
	sendTransport: null,
	recvTransports: new Map(),
	producers: new Map(),
	consumers: new Map(),
	activeSpeaker: null,
});

// ============================================================================
// DERIVED STORES FOR COMPONENTS
// ============================================================================

/**
 * Get media stream for a specific peer
 */
export function getMediaStream(peerId: string): MediaStream | null {
	const state = get(roomState);
	const myPeerId = get(wsPeerIdStore);

	// If it's the local peer, return local stream
	if (peerId === myPeerId) {
		return state.localStream;
	}

	// For remote peers, create stream from consumers
	const stream = new MediaStream();
	let hasMedia = false;

	for (const consumer of state.consumers.values()) {
		if (consumer.appData.peerId === peerId && consumer.track) {
			stream.addTrack(consumer.track);
			hasMedia = true;
		}
	}

	return hasMedia ? stream : null;
}

/**
 * Store for peer media streams
 */
export const peerStreamsStore = derived([roomState, wsPeerIdStore], ([$roomState, $myPeerId]) => {
	const streams: Record<string, MediaStream> = {};

	// Add local stream if available
	if ($myPeerId && $roomState.localStream) {
		streams[$myPeerId] = $roomState.localStream;
	}

	// Create streams for remote peers from consumers
	const peerConsumers = new Map<string, MediaStreamTrack[]>();

	for (const consumer of $roomState.consumers.values()) {
		const peerId = consumer.appData.peerId as string;
		if (!peerConsumers.has(peerId)) {
			peerConsumers.set(peerId, []);
		}
		if (consumer.track && consumer.track.readyState !== "ended") {
			peerConsumers.get(peerId)!.push(consumer.track);
			console.log(`[RoomManager] Added track to stream for ${peerId}:`, {
				consumerId: consumer.id,
				kind: consumer.kind,
				trackState: consumer.track.readyState,
				mediaTag: consumer.appData.mediaTag,
			});
		}
	}

	// Create MediaStreams for each peer
	for (const [peerId, tracks] of peerConsumers) {
		if (tracks.length > 0) {
			const stream = new MediaStream(tracks);
			streams[peerId] = stream;
			console.log(`[RoomManager] Created stream for ${peerId} with ${tracks.length} tracks`);
		}
	}

	return streams;
});

/**
 * Store for peer sessions
 */
export const sessionsStore = derived(roomState, ($state) => $state.sessions);

/**
 * Store for active speaker
 */
export const activeSpeakerStore = derived(roomState, ($state) => $state.activeSpeaker);

/**
 * Store for loading state
 */
export const isLoadingStore = derived(roomState, ($state) => $state.isLoading);

/**
 * Store for error state
 */
export const errorStore = derived(roomState, ($state) => $state.error);

// ============================================================================
// ROOM CONNECTION
// ============================================================================

let roomUnsubscribe: (() => void) | null = null;

/**
 * Join the media room and start processing events
 */
export async function joinRoom(): Promise<void> {
	console.log("[RoomManager] Joining room");

	// Update state
	roomState.update((s) => ({ ...s, isLoading: true, error: null }));

	try {
		// Get router capabilities and initialize device if needed
		const state = get(roomState);
		if (!state.device) {
			const { routerRtpCapabilities } = await stageClient.routerRtpCapabilities.query();
			const device = new MediaSoup.Device();
			await device.load({ routerRtpCapabilities });
			roomState.update((s) => ({ ...s, device }));
			console.log("[RoomManager] Device initialized");
		}

		// Start the media session on the server
		await stageClient.startSession.mutate();
		console.log("[RoomManager] Started media session");

		// Subscribe to room events
		roomUnsubscribe = stageClient.room.subscribe(undefined, {
			onData: async (event) => {
				await processRoomEvent(event);
			},
			onError: (error) => {
				console.error("[RoomManager] Room subscription error:", error);
				roomState.update((s) => ({ ...s, error: error.message, isLoading: false }));
			},
		}).unsubscribe;

		roomState.update((s) => ({ ...s, isConnected: true, isLoading: false }));
		console.log("[RoomManager] Connected to room");
	} catch (error) {
		console.error("[RoomManager] Failed to join room:", error);
		roomState.update((s) => ({
			...s,
			error: (error as Error).message,
			isLoading: false,
		}));
		throw error;
	}
}

/**
 * Leave the room and cleanup
 */
export async function leaveRoom(): Promise<void> {
	console.log("[RoomManager] Leaving room");

	// Unsubscribe from room events
	if (roomUnsubscribe) {
		roomUnsubscribe();
		roomUnsubscribe = null;
	}

	// Close all transports
	const state = get(roomState);

	if (state.sendTransport) {
		state.sendTransport.close();
	}

	for (const transport of state.recvTransports.values()) {
		transport.close();
	}

	// Stop local stream
	if (state.localStream) {
		state.localStream.getTracks().forEach((track) => track.stop());
	}

	// End the media session on the server
	try {
		await stageClient.endSession.mutate();
		console.log("[RoomManager] Ended media session");
	} catch (error) {
		console.error("[RoomManager] Error ending session:", error);
	}

	// Reset state
	roomState.set({
		isConnected: false,
		isLoading: false,
		error: null,
		device: state.device, // Keep device for reuse
		sessions: {},
		localStream: null,
		camEnabled: false,
		micEnabled: false,
		sendTransport: null,
		recvTransports: new Map(),
		producers: new Map(),
		consumers: new Map(),
		activeSpeaker: null,
	});

	console.log("[RoomManager] Left room");
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

/**
 * Process events from the room subscription
 */
async function processRoomEvent(event: any): Promise<void> {
	console.log(`[RoomManager] Processing event: ${event.type}`, event);

	switch (event.type) {
		case "initial":
			await handleInitialState(event);
			break;

		case "sessionChange":
			handleSessionChange(event.sessions);
			break;

		case "producerChange":
			await handleProducerChange(event.producers, event.consumers);
			break;

		case "activeSpeaker":
			handleActiveSpeaker(event.activeSpeaker);
			break;

		case "error":
			handleError(event.error);
			break;
	}
}

/**
 * Handle initial state from server
 */
async function handleInitialState(event: any): Promise<void> {
	console.log("[RoomManager] Handling initial state", event);

	// Update sessions
	roomState.update((s) => ({ ...s, sessions: event.sessions || {} }));

	// Create transports if needed
	if (event.needsSendTransport) {
		await createSendTransport();
	}

	if (event.needsRecvTransport) {
		// Create shared recv transport if we don't have one
		const state = get(roomState);
		if (!state.recvTransports.has("shared")) {
			console.log("[RoomManager] Creating shared recv transport");
			const transportOptions = await stageClient.createTransport.mutate({ direction: "recv" });
			console.log("[RoomManager] Recv transport options:", {
				id: transportOptions.transportOptions.id,
				iceCandidates: transportOptions.transportOptions.iceCandidates,
				iceParameters: transportOptions.transportOptions.iceParameters,
			});
			const transport = state.device!.createRecvTransport(transportOptions.transportOptions);

			// Handle transport events
			transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
				console.log(`[RoomManager] Recv transport ${transport.id} connecting...`);
				try {
					await stageClient.connectTransport.mutate({
						transportId: transport.id,
						dtlsParameters,
					});
					console.log(`[RoomManager] Recv transport ${transport.id} connected successfully`);
					callback();
				} catch (error) {
					console.error(`[RoomManager] Recv transport ${transport.id} connection failed:`, error);
					errback(error as Error);
				}
			});

			// Access the internal RTCPeerConnection for real state monitoring
			try {
				// @ts-ignore - accessing internal handler
				const handler = transport._handler;
				if (handler && handler._pc) {
					const pc = handler._pc;
					console.log(`[RoomManager] Recv transport initial state:`, pc.connectionState || pc.iceConnectionState);

					pc.addEventListener("connectionstatechange", () => {
						console.log(`[RoomManager] Recv transport RTCPeerConnection state:`, pc.connectionState);
						if (pc.connectionState === "failed") {
							console.error(`[RoomManager] Recv transport failed - connectivity issue, removing...`);
							roomState.update((s) => {
								const recvTransports = new Map(s.recvTransports);
								recvTransports.delete("shared");
								return { ...s, recvTransports };
							});
						}
					});

					pc.addEventListener("iceconnectionstatechange", () => {
						console.log(`[RoomManager] Recv transport ICE state:`, pc.iceConnectionState);
						if (pc.iceConnectionState === "failed") {
							console.error(`[RoomManager] Recv transport ICE failed - cannot connect to server`);
						}
					});
				}
			} catch (e) {
				console.warn("[RoomManager] Cannot access RTCPeerConnection for recv transport monitoring");
			}

			// Store shared transport
			roomState.update((s) => {
				const recvTransports = new Map(s.recvTransports);
				recvTransports.set("shared", transport);
				return { ...s, recvTransports };
			});
		}
	}

	// Auto-subscribe to available consumers
	if (event.consumers?.length > 0) {
		for (const consumer of event.consumers) {
			await subscribeToTrack(consumer.peerId, consumer.mediaTag);
		}
	}
}

/**
 * Handle session changes
 */
function handleSessionChange(sessions: Record<string, MediaSession>): void {
	console.log("[RoomManager] Sessions updated", sessions);
	roomState.update((s) => ({ ...s, sessions }));
}

/**
 * Handle producer changes
 */
async function handleProducerChange(producers: any, consumers: any[]): Promise<void> {
	console.log("[RoomManager] Producer change", { producers, consumers });

	// Auto-subscribe to new consumers
	if (consumers?.length > 0) {
		const myPeerId = get(wsPeerIdStore);
		const state = get(roomState);

		for (const { peerId, mediaTag } of consumers) {
			// Skip if it's our own producer
			if (peerId === myPeerId) continue;

			// Check if we already have this consumer
			const hasConsumer = Array.from(state.consumers.values()).some((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);

			if (!hasConsumer) {
				console.log(`[RoomManager] Auto-subscribing to ${peerId}'s ${mediaTag}`);
				try {
					await subscribeToTrack(peerId, mediaTag);
				} catch (error) {
					console.error(`[RoomManager] Failed to subscribe to ${peerId}'s ${mediaTag}:`, error);
				}
			} else {
				console.log(`[RoomManager] Already have consumer for ${peerId}'s ${mediaTag}`);
			}
		}
	}
}

/**
 * Handle active speaker change
 */
function handleActiveSpeaker(activeSpeaker: ActiveSpeaker | null): void {
	console.log("[RoomManager] Active speaker:", activeSpeaker);
	roomState.update((s) => ({ ...s, activeSpeaker }));
}

/**
 * Handle errors
 */
function handleError(error: string): void {
	console.error("[RoomManager] Room error:", error);
	roomState.update((s) => ({ ...s, error }));
}

// ============================================================================
// TRANSPORT MANAGEMENT
// ============================================================================

/**
 * Create send transport for local media
 */
async function createSendTransport(): Promise<void> {
	console.log("[RoomManager] Creating send transport");

	const state = get(roomState);
	if (!state.device) throw new Error("Device not initialized");
	if (state.sendTransport) return;

	const transportOptions = await stageClient.createTransport.mutate({ direction: "send" });
	console.log("[RoomManager] Send transport options:", {
		id: transportOptions.transportOptions.id,
		iceCandidates: transportOptions.transportOptions.iceCandidates,
		iceParameters: transportOptions.transportOptions.iceParameters,
	});
	const transport = state.device.createSendTransport(transportOptions.transportOptions);

	// Handle transport events
	transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
		console.log(`[RoomManager] Send transport ${transport.id} connecting...`);
		try {
			await stageClient.connectTransport.mutate({
				transportId: transport.id,
				dtlsParameters,
			});
			console.log(`[RoomManager] Send transport ${transport.id} connected successfully`);
			callback();
		} catch (error) {
			console.error(`[RoomManager] Send transport ${transport.id} connection failed:`, error);
			errback(error as Error);
		}
	});

	// Access the internal RTCPeerConnection for real state monitoring
	try {
		// @ts-ignore - accessing internal handler
		const handler = transport._handler;
		if (handler && handler._pc) {
			const pc = handler._pc;
			console.log(`[RoomManager] Send transport initial state:`, pc.connectionState || pc.iceConnectionState);

			pc.addEventListener("connectionstatechange", () => {
				console.log(`[RoomManager] Send transport RTCPeerConnection state:`, pc.connectionState);
				if (pc.connectionState === "failed") {
					console.error(`[RoomManager] Send transport failed - connectivity issue, recreating...`);
					roomState.update((s) => ({ ...s, sendTransport: null }));
				}
			});

			pc.addEventListener("iceconnectionstatechange", () => {
				console.log(`[RoomManager] Send transport ICE state:`, pc.iceConnectionState);
				if (pc.iceConnectionState === "failed") {
					console.error(`[RoomManager] Send transport ICE failed - network issue`);
				}
			});
		}
	} catch (e) {
		console.warn("[RoomManager] Cannot access RTCPeerConnection for send transport monitoring");
	}

	transport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
		try {
			const { id } = await stageClient.sendTrack.mutate({
				transportId: transport.id,
				kind,
				rtpParameters,
				paused: false,
				appData: appData as CustomAppData,
			});
			callback({ id });
		} catch (error) {
			errback(error as Error);
		}
	});

	roomState.update((s) => ({ ...s, sendTransport: transport }));
	console.log("[RoomManager] Send transport created");
}

/**
 * Create receive transport for remote media (not used anymore, kept for reference)
 */
async function createRecvTransport(peerId: string): Promise<Transport> {
	// We now use a single shared recv transport for all consumers
	// This function is deprecated
	throw new Error("Use shared recv transport instead");
}

// ============================================================================
// MEDIA MANAGEMENT
// ============================================================================

/**
 * Enable local camera
 */
export async function enableCamera(): Promise<void> {
	console.log("[RoomManager] Enabling camera");

	const state = get(roomState);

	// Ensure device is initialized first
	if (!state.device) {
		console.log("[RoomManager] Device not initialized, initializing now");
		const { routerRtpCapabilities } = await stageClient.routerRtpCapabilities.query();
		const device = new MediaSoup.Device();
		await device.load({ routerRtpCapabilities });
		roomState.update((s) => ({ ...s, device }));
	}

	if (!state.sendTransport) {
		await createSendTransport();
	}

	// Get user media
	const stream = await navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	});

	const videoTrack = stream.getVideoTracks()[0];
	if (!videoTrack) throw new Error("No video track");

	// Get fresh state after transport creation
	const currentState = get(roomState);

	// Create producer
	const producer = await currentState.sendTransport!.produce({
		track: videoTrack,
		appData: { mediaTag: "cam-video" as MediaTag },
	});

	// Update state
	roomState.update((s) => {
		const producers = new Map(s.producers);
		producers.set("cam-video", producer);

		// Update or create local stream
		const localStream = s.localStream || new MediaStream();
		// Remove old video tracks
		localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t));
		localStream.addTrack(videoTrack);

		return { ...s, producers, localStream, camEnabled: true };
	});

	console.log("[RoomManager] Camera enabled");
}

/**
 * Disable local camera
 */
export async function disableCamera(): Promise<void> {
	console.log("[RoomManager] Disabling camera");

	const state = get(roomState);
	const producer = state.producers.get("cam-video");

	if (producer) {
		producer.close();

		// Stop the track
		if (state.localStream) {
			state.localStream.getVideoTracks().forEach((track) => {
				track.stop();
				state.localStream!.removeTrack(track);
			});
		}

		// Update state
		roomState.update((s) => {
			const producers = new Map(s.producers);
			producers.delete("cam-video");
			return { ...s, producers, camEnabled: false };
		});
	}

	console.log("[RoomManager] Camera disabled");
}

/**
 * Enable local microphone
 */
export async function enableMicrophone(): Promise<void> {
	console.log("[RoomManager] Enabling microphone");

	const state = get(roomState);

	// Ensure device is initialized first
	if (!state.device) {
		console.log("[RoomManager] Device not initialized, initializing now");
		const { routerRtpCapabilities } = await stageClient.routerRtpCapabilities.query();
		const device = new MediaSoup.Device();
		await device.load({ routerRtpCapabilities });
		roomState.update((s) => ({ ...s, device }));
	}

	if (!state.sendTransport) {
		await createSendTransport();
	}

	// Get user media
	const stream = await navigator.mediaDevices.getUserMedia({
		video: false,
		audio: true,
	});

	const audioTrack = stream.getAudioTracks()[0];
	if (!audioTrack) throw new Error("No audio track");

	// Get fresh state after transport creation
	const currentState = get(roomState);

	// Create producer
	const producer = await currentState.sendTransport!.produce({
		track: audioTrack,
		appData: { mediaTag: "mic-audio" as MediaTag },
	});

	// Update state
	roomState.update((s) => {
		const producers = new Map(s.producers);
		producers.set("mic-audio", producer);

		// Update or create local stream
		const localStream = s.localStream || new MediaStream();
		// Remove old audio tracks
		localStream.getAudioTracks().forEach((t) => localStream.removeTrack(t));
		localStream.addTrack(audioTrack);

		return { ...s, producers, localStream, micEnabled: true };
	});

	console.log("[RoomManager] Microphone enabled");
}

/**
 * Disable local microphone
 */
export async function disableMicrophone(): Promise<void> {
	console.log("[RoomManager] Disabling microphone");

	const state = get(roomState);
	const producer = state.producers.get("mic-audio");

	if (producer) {
		producer.close();

		// Stop the track
		if (state.localStream) {
			state.localStream.getAudioTracks().forEach((track) => {
				track.stop();
				state.localStream!.removeTrack(track);
			});
		}

		// Update state
		roomState.update((s) => {
			const producers = new Map(s.producers);
			producers.delete("mic-audio");
			return { ...s, producers, micEnabled: false };
		});
	}

	console.log("[RoomManager] Microphone disabled");
}

/**
 * Subscribe to a remote peer's track
 */
async function subscribeToTrack(peerId: string, mediaTag: MediaTag): Promise<void> {
	console.log(`[RoomManager] Subscribing to ${peerId}'s ${mediaTag}`);

	const state = get(roomState);

	// Ensure device is initialized
	if (!state.device) {
		console.error("[RoomManager] Cannot subscribe: device not initialized");
		return;
	}

	// We use a single recv transport for all consumers
	let transport = state.recvTransports.get("shared");
	if (!transport) {
		console.log("[RoomManager] Creating shared recv transport for consumer");
		const transportOptions = await stageClient.createTransport.mutate({ direction: "recv" });
		console.log("[RoomManager] Consumer recv transport options:", {
			id: transportOptions.transportOptions.id,
			iceCandidates: transportOptions.transportOptions.iceCandidates,
			iceParameters: transportOptions.transportOptions.iceParameters,
		});
		transport = state.device.createRecvTransport(transportOptions.transportOptions);

		// Handle transport events
		transport.on("connect", async ({ dtlsParameters }, callback, errback) => {
			console.log(`[RoomManager] Consumer transport ${transport.id} connecting...`);
			try {
				await stageClient.connectTransport.mutate({
					transportId: transport.id,
					dtlsParameters,
				});
				console.log(`[RoomManager] Consumer transport ${transport.id} connected successfully`);
				callback();
			} catch (error) {
				console.error(`[RoomManager] Consumer transport ${transport.id} connection failed:`, error);
				errback(error as Error);
			}
		});

		// Access the internal RTCPeerConnection for real state monitoring
		try {
			// @ts-ignore - accessing internal handler
			const handler = transport._handler;
			if (handler && handler._pc) {
				const pc = handler._pc;
				console.log(`[RoomManager] Consumer transport initial state:`, pc.connectionState || pc.iceConnectionState);

				pc.addEventListener("connectionstatechange", () => {
					console.log(`[RoomManager] Consumer transport RTCPeerConnection state:`, pc.connectionState);
					if (pc.connectionState === "failed") {
						console.error(`[RoomManager] Consumer transport failed - network issue, removing...`);
						roomState.update((s) => {
							const recvTransports = new Map(s.recvTransports);
							recvTransports.delete("shared");
							return { ...s, recvTransports };
						});
					}
				});

				pc.addEventListener("iceconnectionstatechange", () => {
					console.log(`[RoomManager] Consumer transport ICE state:`, pc.iceConnectionState);
					if (pc.iceConnectionState === "failed") {
						console.error(`[RoomManager] Consumer transport ICE failed - check NAT/firewall`);
					}
				});
			}
		} catch (e) {
			console.warn("[RoomManager] Cannot access RTCPeerConnection for consumer transport monitoring");
		}

		// Store shared transport
		roomState.update((s) => {
			const recvTransports = new Map(s.recvTransports);
			recvTransports.set("shared", transport);
			return { ...s, recvTransports };
		});
	}

	console.log(`[RoomManager] Using transport ${transport.id} for ${peerId}`);

	// Get consumer parameters from server
	const consumerParams = await stageClient.recvTrack.mutate({
		mediaPeerId: peerId,
		mediaTag,
		rtpCapabilities: state.device.rtpCapabilities,
	});

	if (!consumerParams) {
		console.warn(`[RoomManager] No consumer params for ${peerId}'s ${mediaTag}`);
		return;
	}

	console.log(`[RoomManager] Got consumer params for ${peerId}'s ${mediaTag}:`, {
		id: consumerParams.id,
		producerId: consumerParams.producerId,
		kind: consumerParams.kind,
		producerPaused: consumerParams.producerPaused,
	});

	// Create consumer
	const consumer = await transport.consume({
		id: consumerParams.id,
		producerId: consumerParams.producerId,
		kind: consumerParams.kind,
		rtpParameters: consumerParams.rtpParameters,
		appData: { peerId, mediaTag } as CustomAppData,
	});

	console.log(`[RoomManager] Created consumer ${consumer.id} for ${peerId}'s ${mediaTag}`, {
		paused: consumer.paused,
		track: consumer.track ? "present" : "missing",
		trackState: consumer.track?.readyState,
		kind: consumer.kind,
	});

	// Store consumer immediately
	roomState.update((s) => {
		const consumers = new Map(s.consumers);
		consumers.set(consumer.id, consumer);
		return { ...s, consumers };
	});

	// Handle consumer events
	consumer.on("transportclose", () => {
		console.log(`[RoomManager] Consumer ${consumer.id} transport closed`);
		roomState.update((s) => {
			const consumers = new Map(s.consumers);
			consumers.delete(consumer.id);
			return { ...s, consumers };
		});
	});

	consumer.on("producerclose", () => {
		console.log(`[RoomManager] Consumer ${consumer.id} producer closed`);
		roomState.update((s) => {
			const consumers = new Map(s.consumers);
			consumers.delete(consumer.id);
			return { ...s, consumers };
		});
	});

	// Always resume the consumer - server creates them paused
	console.log(`[RoomManager] Resuming consumer ${consumer.id}`);
	try {
		// Resume on server first
		await stageClient.resumeConsumer.mutate({ consumerId: consumer.id });
		// Then resume locally
		await consumer.resume();
		console.log(`[RoomManager] Consumer ${consumer.id} resumed successfully`);
	} catch (error) {
		console.error(`[RoomManager] Failed to resume consumer ${consumer.id}:`, error);
	}

	// Force update to trigger re-render
	roomState.update((s) => ({ ...s }));

	console.log(`[RoomManager] Successfully subscribed to ${peerId}'s ${mediaTag}, final track state:`, consumer.track?.readyState);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { roomState };
