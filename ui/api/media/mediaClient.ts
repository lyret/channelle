import * as MediaSoup from "mediasoup-client";
import DeepEqual from "deep-equal";
import { writable, derived, get } from "svelte/store";
import { mediaClient, userClient, wsPeerIdStore } from "../_trpcClient";
import type { Peer, TransportDirection, CustomAppData, MediaTag } from "~/types/serverSideTypes";

/**
 * MediaRoom API - WebRTC media streaming and peer management
 *
 * This API handles all WebRTC/MediaSoup functionality for real-time
 * audio/video communication between participants in a show.
 *
 * Key responsibilities:
 * - WebRTC media streaming (audio/video)
 * - Peer connection management
 * - MediaSoup transport handling
 * - Real-time synchronization of media state
 * - Stage UI state for immediate visual feedback
 *
 * Architecture:
 * - Uses MediaSoup for professional-grade WebRTC
 * - Automatic peer-to-peer media routing
 * - Scalable one-to-many broadcasting
 * - Real-time synchronization via polling
 *
 * Usage:
 * 1. Join media room: await joinMediaRoom()
 * 2. Start media: await startLocalMediaStream(true, true)
 * 3. Send streams: await sendMediaStreams()
 * 4. Subscribe to peers: automatic via polling
 */

type Transport = MediaSoup.types.Transport<CustomAppData>;
type Consumer = MediaSoup.types.Consumer<CustomAppData>;
type Producer = MediaSoup.types.Producer<CustomAppData>;

// ============================================================================
// MEDIA STORES
// ============================================================================

/**
 * MediaSoup device - initialized when joining media room with router RTP capabilities
 * Contains codec information and WebRTC capabilities
 */
export const deviceStore = writable<MediaSoup.types.Device | null>(null);

// ============================================================================
// STAGE UI STORES (Real-time display state)
// ============================================================================

/**
 * Real-time curtains display state
 * Updated immediately when scene curtains setting changes
 * Used by stage UI to show/hide curtains instantly
 */
export const stageCurtainsStore = writable<boolean>(true);

/**
 * Real-time chat panel visibility state
 * Updated immediately when chat enabled setting changes
 * Used by stage UI to show/hide chat panel
 */
export const stageChatEnabledStore = writable<boolean>(true);

/**
 * Real-time gratitude effects availability state
 * Updated immediately when gratitude effects enabled setting changes
 * Used by stage UI to enable/disable gratitude effect buttons (flowers, applause)
 */
export const stageGratitudeEffectsEnabledStore = writable<boolean>(true);

/**
 * Real-time critical effects availability state
 * Updated immediately when critical effects enabled setting changes
 * Used by stage UI to enable/disable critical effect buttons (tomato)
 */
export const stageCriticalEffectsEnabledStore = writable<boolean>(true);

/**
 * Real-time visitor audio permission state
 * Updated immediately when visitor audio setting changes
 * Used by stage UI to enable/disable visitor microphones
 */
export const stageHaveVisitorAudioEnabledStore = writable<boolean>(true);

/**
 * Real-time visitor video permission state
 * Updated immediately when visitor video setting changes
 * Used by stage UI to enable/disable visitor cameras
 */
export const stageHaveVisitorVideoEnabledStore = writable<boolean>(true);

// ============================================================================
// MEDIA STATE STORES
// ============================================================================

/**
 * General paused state for media streaming
 * @deprecated Use camPausedStore and micPausedStore for specific control
 */
export const paused = writable(false);

/**
 * Video track pause state - when true, video is paused/muted locally
 * Controls whether local video is being sent to other participants
 */
export const camPausedStore = writable(false);

/**
 * Audio track pause state - when true, audio is paused/muted locally
 * Controls whether local audio is being sent to other participants
 */
export const micPausedStore = writable(false);

/**
 * Local media stream from browser getUserMedia
 * Contains user's camera and/or microphone streams
 * Set when startLocalMediaStream() is called successfully
 */
export const localMediaStream = writable<MediaStream | null>(null);

// ============================================================================
// WEBRTC TRANSPORT STORES
// ============================================================================

/**
 * Dictionary of receiving transports, indexed by peer ID
 * Each transport handles incoming media streams from one peer
 * Created automatically when subscribing to remote tracks
 */
export const recvTransports = writable<Record<string, Transport>>({});

/**
 * Single sending transport for outgoing media streams
 * Handles sending local audio/video to all other participants
 * Created when sendMediaStreams() is called
 */
export const sendTransport = writable<Transport | null>(null);

/**
 * Local video producer - sends video to other participants
 * Created when local video stream is being produced
 */
export const videoProducer = writable<Producer | null>(null);

/**
 * Local audio producer - sends audio to other participants
 * Created when local audio stream is being produced
 */
export const audioProducer = writable<Producer | null>(null);

/**
 * Currently active speaker in the room
 * Updated periodically through room sync
 */
export const currentActiveSpeakerStore = writable<{ peerId?: string | null }>({});

/**
 * List of all active consumers for receiving remote media
 * Each consumer represents a remote track being received
 */
export const consumersStore = writable<Consumer[]>([]);

/**
 * Map of all peers in the room with their metadata
 * Updated periodically through room sync
 */
export const peersStore = writable<Record<string, Peer>>({});

/**
 * Map of all peer sessions with their media availability and stats
 * Updated periodically through room sync
 */
export const sessionsStore = writable<Record<string, any>>({});

/** The current users peer information  */
export const peerStore = derived([peersStore, wsPeerIdStore], ([$peers, $peerId]) => {
	return $peers[$peerId] || ({} as Peer);
});

/**
 * Indicates whether the client has successfully joined the room
 */
export const hasJoinedRoomStore = derived([peerStore], ([$peer]) => {
	return Object.keys($peer).length > 0;
});

/**
 * Indicates whether the client is banned from the room
 */
export const isBannedFromTheRoom = derived([peerStore], ([$peer]) => {
	return $peer && $peer.banned;
});

// ============================================================================
// INTERNAL STATE (NOT EXPOSED AS STORES)
// ============================================================================

// ============================================================================
// MEDIA CAPABILITY STORES
// ============================================================================

/**
 * Whether local camera/media stream is available
 * True when getUserMedia has successfully provided a media stream
 */
export const hasLocalCamStore = derived(localMediaStream, ($localCam) => !!$localCam);

/**
 * Whether send transport is available for outgoing media
 * True when WebRTC transport is ready to send local streams
 */
export const hasSendTransportStore = derived(sendTransport, ($transport) => !!$transport);

/**
 * Whether any receive transports are available for incoming media
 * True when at least one peer connection is established for receiving
 */
export const hasRecvTransportStore = derived(recvTransports, ($transports) => Object.keys($transports).length > 0);

// ============================================================================
// INTERNAL STATE (Not reactive)
// ============================================================================

// Polling interval for room state synchronization (1 second intervals)
let _pollingInterval: ReturnType<typeof setInterval> | undefined;
// Previous peer state for detecting changes during synchronization
let _previousSyncedPeers: Record<string, any> = {};

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Debug utility to get detailed state information about consumers and transports
 */
export function getDebugState() {
	const consumers = get(consumersStore);
	const transports = get(recvTransports);
	const peers = get(peersStore);
	const sessions = get(sessionsStore);

	return {
		consumers: consumers.map((consumer) => ({
			id: consumer.id,
			peerId: consumer.appData.peerId,
			mediaTag: consumer.appData.mediaTag,
			paused: consumer.paused,
			closed: consumer.closed,
			trackState: consumer.track?.readyState,
			trackId: consumer.track?.id,
			transportId: (consumer as any).transport?.id,
			connectionState: consumer.rtpReceiver?.transport?.state,
		})),
		transports: Object.entries(transports).map(([peerId, transport]) => ({
			peerId,
			transportId: transport.id,
			connectionState: transport.connectionState,
			iceConnectionState: transport.connectionState,
			iceGatheringState: transport.connectionState,
			dtlsState: transport.connectionState,
			closed: transport.closed,
		})),
		peers: Object.entries(peers).map(([id, peer]) => ({
			id,
			online: peer.online,
			name: peer.name,
			videoMuted: peer.videoMuted,
			audioMuted: peer.audioMuted,
		})),
		sessions: Object.entries(sessions).map(([id, session]) => ({
			id,
			hasMedia: !!session.media,
			videoAvailable: !!(session.media && session.media["cam-video"]),
			audioAvailable: !!(session.media && session.media["mic-audio"]),
		})),
	};
}

/**
 * Debug utility to log current state
 */
export function logDebugState(context = "DEBUG") {
	const state = getDebugState();
	console.group(`[${context}] Room Client Debug State`);
	console.log("Consumers:", state.consumers);
	console.log("Transports:", state.transports);
	console.log("Peers:", state.peers);
	console.log("Sessions:", state.sessions);
	console.groupEnd();
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Join the media room and initialize WebRTC capabilities
 *
 * This is the primary entry point for establishing media connectivity.
 * It initializes the MediaSoup device, establishes server connection,
 * and begins automatic room state synchronization.
 *
 * @throws {Error} If device initialization fails or connection is rejected
 *
 * @example
 * ```typescript
 * try {
 *   await joinMediaRoom();
 *   console.log('Successfully joined media room');
 * } catch (error) {
 *   console.error('Failed to join:', error);
 * }
 * ```
 */
export async function joinMediaRoom() {
	// Signal that we're a new peer and initialize our
	// mediasoup-client device, if this is our first time connecting
	const { peerId, routerRtpCapabilities } = await mediaClient.join.mutate();
	console.log("[MediaRoom] Joined with peer id", peerId);

	// Initialize the MediaSoup device
	try {
		let device = get(deviceStore);
		if (!device) {
			// FIXME: Debug logging for flatbuffers issue - remove after fixing
			console.log("[MS Debug] Router RTP capabilities:", JSON.stringify(routerRtpCapabilities, null, 2));

			// Validate router capabilities
			if (!routerRtpCapabilities) {
				throw new Error("Missing router RTP capabilities");
			}
			if (!routerRtpCapabilities.codecs || routerRtpCapabilities.codecs.length === 0) {
				throw new Error("Invalid router RTP capabilities: missing codecs");
			}

			device = new MediaSoup.Device();
			await device.load({ routerRtpCapabilities });
			deviceStore.set(device);

			// FIXME: Debug logging for flatbuffers issue - remove after fixing
			console.log("[MS Debug] Device loaded successfully:", {
				loaded: device.loaded,
				rtpCapabilities: !!device.rtpCapabilities,
				sctpCapabilities: !!device.sctpCapabilities,
			});
		}
	} catch (error: any) {
		if (error.name === "UnsupportedError") {
			console.error("[MEDIA DEVICE] The browser not supported for video calls");
			throw error;
		} else {
			console.error("[MEDIA DEVICE] The media device could not be initialized:", error);
			// FIXME: Debug logging for flatbuffers issue - remove after fixing
			console.error("[MS Debug] Device initialization error details:", error.stack);
			throw error;
		}
	}

	// Let's poll at 1-second intervals when joined
	_pollingInterval = setInterval(async () => {
		try {
			await syncMediaRoom();
		} catch (err) {
			console.error("[MediaRoom] Poll stopped:", err);
			clearInterval(_pollingInterval);
		}
	}, 1000);
}

/**
 * Leave the media room and clean up all WebRTC resources
 *
 * Properly closes all media connections, stops synchronization,
 * and releases browser media resources. Should be called when
 * the user navigates away or closes the application.
 *
 * @example
 * ```typescript
 * await leaveMediaRoom();
 * console.log('Left media room and cleaned up resources');
 * ```
 */
export async function leaveMediaRoom() {
	console.log("[MediaRoom] leaving the room");

	// Stop polling
	if (_pollingInterval) {
		clearInterval(_pollingInterval);
		_pollingInterval = undefined;
	}

	// Close everything on the server-side (transports, producers, consumers)
	await mediaClient.leave.mutate();

	// Closing the transports closes all producers and consumers. we
	// don't need to do anything beyond closing the transports, except
	// to set all our local variables to their initial states
	const currentRecvTransports = get(recvTransports);
	const currentSendTransport = get(sendTransport);

	// Close all receive transports
	Object.values(currentRecvTransports).forEach((transport) => transport.close());
	currentSendTransport?.close();

	_previousSyncedPeers = {};

	// Reset all stores
	recvTransports.set({});
	sendTransport.set(null);
	videoProducer.set(null);
	audioProducer.set(null);
	localMediaStream.set(null);
	consumersStore.set([]);
}

/**
 * Synchronize media room state with server
 *
 * Fetches current peer list, session information, and stage UI state
 * from the server. Automatically manages consumer connections for new
 * peers and cleans up resources for departed peers.
 *
 * Called automatically every second when connected to the room.
 * Can also be called manually for immediate synchronization.
 *
 * @private Generally called automatically, but can be used for manual sync
 */
export async function syncMediaRoom() {
	const { peers, sessions, activeSpeaker, currentScene } = await mediaClient.sync.query();

	// Update the known stage UI states (needed for real-time stage display)
	if (currentScene) {
		stageCurtainsStore.set(currentScene.curtains);
		stageChatEnabledStore.set(currentScene.chatEnabled);
		stageGratitudeEffectsEnabledStore.set(currentScene.gratitudeEffectsEnabled);
		stageCriticalEffectsEnabledStore.set(currentScene.criticalEffectsEnabled);
		stageHaveVisitorAudioEnabledStore.set(currentScene.visitorAudioEnabled);
		stageHaveVisitorVideoEnabledStore.set(currentScene.visitorVideoEnabled);
	}

	// Update the active speaker
	currentActiveSpeakerStore.set(activeSpeaker);

	// Decide if we need to update tracks list
	// build list of peers, sorted by join time, removing last
	// seen time and stats, so we can easily do a deep-equals
	// comparison. compare this list with the cached list from last poll.
	const thisPeersList = _sortPeers(peers);
	const lastPeersList = _sortPeers(_previousSyncedPeers);
	const consumers = get(consumersStore);

	// If a peer has gone away, we need to close all consumers we have
	// for that peer
	if (!DeepEqual(thisPeersList, lastPeersList)) {
		console.log("[Room] Peer list changed, checking for departed peers");
		for (const id in _previousSyncedPeers) {
			if (!peers[id]) {
				console.log(`[Room] Peer ${id} has left - cleaning up resources`);

				// Close all consumers for this peer
				const peerConsumers = consumers.filter((consumer) => consumer.appData.peerId === id);
				console.log(`[Room] Found ${peerConsumers.length} consumers to close for peer ${id}`);

				for (const consumer of peerConsumers) {
					try {
						console.log(`[Room] Closing consumer ${consumer.id} for departed peer ${id}`);
						await closeConsumer(consumer);
					} catch (error) {
						console.error(`[Room] Error closing consumer for departed peer ${id}:`, error);
					}
				}

				// Close and remove the transport for this peer
				const transports = get(recvTransports);
				if (transports[id]) {
					console.log(`[Room] Closing transport for departed peer ${id}`);
					try {
						transports[id].close();
						recvTransports.update((t) => {
							const updated = { ...t };
							delete updated[id];
							return updated;
						});
						console.log(`[Room] Successfully closed transport for peer ${id}`);
					} catch (error) {
						console.error(`[Room] Error closing transport for peer ${id}:`, error);
					}
				}
			}
		}

		// Check for new peers
		for (const id in peers) {
			if (!_previousSyncedPeers[id]) {
				console.log(`[Room] New peer ${id} (${peers[id].name}) joined`);
			}
		}
	}

	// If a peer has stopped sending media that we are consuming, we
	// need to close the consumer
	const consumersToClose: Consumer[] = [];

	consumers.forEach((consumer) => {
		const { peerId, mediaTag } = consumer.appData;
		const session = sessions[peerId];
		const peer = peers[peerId];

		// Enhanced logging for consumer validation
		console.log(`[Room] Validating consumer ${consumer.id} for peer ${peerId} (${mediaTag}):`, {
			hasSession: !!session,
			hasSessionMedia: !!(session && session.media),
			hasMediaTag: !!(session && session.media && session.media[mediaTag]),
			peerOnline: peer?.online,
			consumerClosed: consumer.closed,
		});

		// Type guard to ensure session exists and peer is still online
		if (!session || typeof session !== "object" || !peer?.online) {
			console.log("[Room] Peer " + peerId + " session invalid or offline - marking consumer for closure");
			consumersToClose.push(consumer);
			return;
		}

		// Access media session safely
		if (!session.media || typeof session.media !== "object") {
			console.log(`[Room] Peer ${peerId} has no media session - marking consumer for closure`);
			consumersToClose.push(consumer);
			return;
		}

		// Check if the specific mediaTag exists
		if (!Object.prototype.hasOwnProperty.call(session.media, mediaTag)) {
			console.log(`[Room] Peer ${peerId} no longer transmitting ${mediaTag} - marking consumer for closure`);
			consumersToClose.push(consumer);
			return;
		}

		// Additional check for consumer health
		if (consumer.closed || (consumer.track && consumer.track.readyState === "ended")) {
			console.log(`[Room] Consumer ${consumer.id} is closed or track ended - marking for cleanup`);
			consumersToClose.push(consumer);
			return;
		}
	});

	// Close consumers that are no longer valid
	if (consumersToClose.length > 0) {
		console.log(`[Room] Closing ${consumersToClose.length} invalid consumers`);
		for (const consumer of consumersToClose) {
			try {
				await closeConsumer(consumer);
			} catch (error) {
				console.error("[Room] Error closing invalid consumer:", error);
			}
		}
	}

	// Update the peers store with full peer information
	peersStore.set(peers);

	// Update the sessions store with media availability information
	sessionsStore.set(sessions);

	// Update the last poll sync data
	_previousSyncedPeers = peers;
}

/**
 * Updates the name of a peer in the room
 */
export async function updatePeerName(peerId: string, name: string) {
	await userClient.update.mutate({
		id: peerId,
		name,
	});
}

/**
 * Updates the banned status of a peer in the room
 */
export async function updatePeerBannedStatus(peerId: string, banned: boolean) {
	await userClient.update.mutate({
		id: peerId,
		banned,
	});
}

/**
 * Updates the actor status of a peer in the room
 */
export async function updatePeerActorStatus(peerId: string, actor: boolean) {
	await userClient.update.mutate({
		id: peerId,
		actor,
	});
}

/**
 * Updates the manager status of a peer in the room
 */
export async function updatePeerManagerStatus(peerId: string, manager: boolean) {
	await userClient.update.mutate({
		id: peerId,
		manager,
	});
}

/**
 * Updates multiple peer properties at once
 */
export async function updatePeerProperties(peerId: string, data: { actor?: boolean; manager?: boolean; banned?: boolean }) {
	await userClient.update.mutate({
		id: peerId,
		...data,
	});
}

/**
 * Access local media streams from the browser
 * @param audio - Whether to request audio access (default: true)
 * @param video - Whether to request video access (default: true)
 */
export async function startLocalMediaStream(audio: boolean = true, video: boolean = true) {
	console.log(`[Media] Accessing the local media stream (audio: ${audio ? 1 : 0}, video: ${video ? 1 : 0})`);
	const stream = await navigator.mediaDevices.getUserMedia({
		video: video,
		audio: audio,
	});
	localMediaStream.set(stream);
}

/**
 * Add audio track to existing media stream or create new stream
 * Preserves existing video tracks if present
 */
export async function enableAudioStream() {
	console.log("[Media] Enabling audio stream");
	const existingStream = get(localMediaStream);

	// Check if we already have audio
	if (existingStream && existingStream.getAudioTracks().length > 0) {
		console.log("[Media] Audio track already exists");
		return;
	}

	console.log("[Media] Current stream state:", {
		hasStream: !!existingStream,
		videoTracks: existingStream?.getVideoTracks().length || 0,
		audioTracks: existingStream?.getAudioTracks().length || 0,
	});

	try {
		// Request only audio
		const audioStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false,
		});

		if (existingStream) {
			// Add audio track to existing stream
			const audioTrack = audioStream.getAudioTracks()[0];
			existingStream.addTrack(audioTrack);
			console.log("[Media] Added audio track to existing stream");

			// Stop the temporary audio stream
			audioStream.getTracks().forEach((track) => {
				if (track !== audioTrack) {
					track.stop();
				}
			});
		} else {
			// Set the new audio stream as the local stream
			localMediaStream.set(audioStream);
			console.log("[Media] Created new audio stream");
		}
	} catch (error) {
		console.error("[Media] Failed to enable audio stream:", error);
		throw error;
	}
}

/**
 * Add video track to existing media stream or create new stream
 * Preserves existing audio tracks if present
 */
export async function enableVideoStream() {
	console.log("[Media] Enabling video stream");
	const existingStream = get(localMediaStream);

	// Check if we already have video
	if (existingStream && existingStream.getVideoTracks().length > 0) {
		console.log("[Media] Video track already exists");
		return;
	}

	console.log("[Media] Current stream state:", {
		hasStream: !!existingStream,
		videoTracks: existingStream?.getVideoTracks().length || 0,
		audioTracks: existingStream?.getAudioTracks().length || 0,
	});

	try {
		// Request only video
		const videoStream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: true,
		});

		if (existingStream) {
			// Add video track to existing stream
			const videoTrack = videoStream.getVideoTracks()[0];
			existingStream.addTrack(videoTrack);
			console.log("[Media] Added video track to existing stream");

			// Stop the temporary video stream
			videoStream.getTracks().forEach((track) => {
				if (track !== videoTrack) {
					track.stop();
				}
			});
		} else {
			// Set the new video stream as the local stream
			localMediaStream.set(videoStream);
			console.log("[Media] Created new video stream");
		}
	} catch (error) {
		console.error("[Media] Failed to enable video stream:", error);
		throw error;
	}
}

/**
 * Enable video with proper stream and producer management
 * Creates stream if needed and starts producing
 */
export async function enableVideo() {
	console.log("[Media] Enabling video");

	// First ensure we have a video stream
	await enableVideoStream();

	// Check if we need to send streams (create producers)
	if (get(hasJoinedRoomStore)) {
		const stream = get(localMediaStream);
		console.log("[Media] Post-enableVideoStream state:", {
			hasStream: !!stream,
			videoTracks: stream?.getVideoTracks().length || 0,
			audioTracks: stream?.getAudioTracks().length || 0,
			hasVideoProducer: !!get(videoProducer),
		});

		if (stream && stream.getVideoTracks().length > 0 && !get(videoProducer)) {
			// Create transport if needed and start producing
			await sendMediaStreams();
		}
	}
}

/**
 * Enable audio with proper stream and producer management
 * Creates stream if needed and starts producing
 */
export async function enableAudio() {
	console.log("[Media] Enabling audio");

	// First ensure we have an audio stream
	await enableAudioStream();

	// Check if we need to send streams (create producers)
	if (get(hasJoinedRoomStore)) {
		const stream = get(localMediaStream);
		console.log("[Media] Post-enableAudioStream state:", {
			hasStream: !!stream,
			videoTracks: stream?.getVideoTracks().length || 0,
			audioTracks: stream?.getAudioTracks().length || 0,
			hasAudioProducer: !!get(audioProducer),
		});

		if (stream && stream.getAudioTracks().length > 0 && !get(audioProducer)) {
			// Create transport if needed and start producing
			await sendMediaStreams();
		}
	}
}

/**
 * Disable video by stopping track and closing producer
 */
export async function disableVideo() {
	console.log("[Media] Disabling video");
	const stream = get(localMediaStream);
	const producer = get(videoProducer);

	// Close producer if it exists
	if (producer) {
		producer.close();
		videoProducer.set(null);
	}

	// Stop and remove video tracks
	if (stream) {
		const videoTracks = stream.getVideoTracks();
		videoTracks.forEach((track) => {
			track.stop();
			stream.removeTrack(track);
		});
	}
}

/**
 * Disable audio by stopping track and closing producer
 */
export async function disableAudio() {
	console.log("[Media] Disabling audio");
	const stream = get(localMediaStream);
	const producer = get(audioProducer);

	// Close producer if it exists
	if (producer) {
		producer.close();
		audioProducer.set(null);
	}

	// Stop and remove audio tracks
	if (stream) {
		const audioTracks = stream.getAudioTracks();
		audioTracks.forEach((track) => {
			track.stop();
			stream.removeTrack(track);
		});
	}
}

/**
 * Start transporting activated local streams to the server
 * Creates send transport and producers for audio/video tracks
 */
export async function sendMediaStreams() {
	console.log("[Room] Sending streams");

	// Make sure we're joined and have a local media stream
	if (!get(hasJoinedRoomStore)) {
		throw new Error("Not joined");
	}

	const stream = get(localMediaStream);
	if (!stream) {
		throw new Error("Local media stream not available");
	}

	// Create a transport for outgoing media, if we don't already have one
	let transport = get(sendTransport);
	if (!transport) {
		const myPeerId = get(wsPeerIdStore);
		transport = await _createTransport("send", myPeerId);
		sendTransport.set(transport);
	}

	// Start sending video if we have a local video stream and no existing producer
	// the transport logic will initiate a
	// signaling conversation with the server to set up an outbound rtp
	// stream for the camera video track.
	if (stream.getVideoTracks().length > 0 && !get(videoProducer)) {
		console.log("[MS] Creating video producer with tracks:", stream.getVideoTracks());
		const producer: Producer = await transport.produce({
			track: stream.getVideoTracks()[0],
			// Just two resolutions, for now, as chrome 75 seems to ignore more
			// than two encodings
			encodings: [
				{ maxBitrate: 96000, scaleResolutionDownBy: 4 },
				{ maxBitrate: 680000, scaleResolutionDownBy: 1 },
			],
			appData: { mediaTag: "cam-video", peerId: get(wsPeerIdStore) },
		});
		console.log("[MS] Video producer created:", producer.id);
		videoProducer.set(producer);

		if (get(camPausedStore)) {
			producer.pause();
		}
	}

	// Start sending audio if we have a local audio stream and no existing producer
	if (stream.getAudioTracks().length > 0 && !get(audioProducer)) {
		console.log("[MS] Creating audio producer with tracks:", stream.getAudioTracks());
		const producer: Producer = await transport.produce({
			track: stream.getAudioTracks()[0],
			appData: { mediaTag: "mic-audio", peerId: get(wsPeerIdStore) },
		});
		console.log("[MS] Audio producer created:", producer.id);
		audioProducer.set(producer);

		if (get(micPausedStore)) {
			try {
				producer.pause();
			} catch (error) {
				console.error(error);
			}
		}
	}
}

/**
 * Toggle video producer paused state
 * @param paused - Optional explicit paused state, toggles if not provided
 */
export async function toggleVideoPaused(paused?: boolean) {
	const currentPaused = get(camPausedStore);
	const newPaused = paused !== undefined ? paused : !currentPaused;
	camPausedStore.set(newPaused);

	const producer = get(videoProducer);
	if (newPaused && producer) {
		await pauseProducer(producer);
	} else if (!newPaused && producer) {
		await resumeProducer(producer);
	}
}

/**
 * Toggle audio producer paused state
 * @param paused - Optional explicit paused state, toggles if not provided
 */
export async function toggleAudioPaused(paused?: boolean) {
	const currentPaused = get(micPausedStore);
	const newPaused = paused !== undefined ? paused : !currentPaused;
	micPausedStore.set(newPaused);

	const producer = get(audioProducer);
	if (newPaused && producer) {
		await pauseProducer(producer);
	} else if (!newPaused && producer) {
		await resumeProducer(producer);
	}
}

/**
 * Stop transporting all media to the server
 * Closes send transport and all associated producers
 */
export async function closeMediaStreams() {
	const stream = get(localMediaStream);
	const transport = get(sendTransport);

	if (!stream || !transport) {
		return;
	}

	console.log("[MS] Stopping sending of media streams");
	await mediaClient.closeTransport.mutate({ transportId: transport.id });

	// Closing the sendTransport closes all associated producers. when
	// the Video Producer and Audio Producer are closed,
	// mediasoup-client stops the local camera tracks, so we don't need to
	// do anything except set all our local variables to null.
	transport.close();

	// Reset all related stores
	sendTransport.set(null);
	videoProducer.set(null);
	audioProducer.set(null);
	localMediaStream.set(null);
}

/**
 * Subscribe to a remote track from a peer
 * Creates consumer for receiving the specified media
 * @param peerId - ID of the peer to subscribe to
 * @param mediaTag - Type of media to subscribe to (e.g., "cam-video", "mic-audio")
 */
export async function subscribeToTrack(peerId: string, mediaTag: MediaTag) {
	console.log(`[MS] Starting subscription to ${mediaTag} track from peer ${peerId}`);

	// Get or create a receiver transport for this specific peer
	const transports = get(recvTransports);
	let transport = transports[peerId];
	if (!transport) {
		console.log(`[Room] Creating receive transport for peer ${peerId}`);
		try {
			transport = await _createTransport("recv", peerId);
			recvTransports.update((t) => ({ ...t, [peerId]: transport }));
			console.log(`[Room] Successfully created transport for peer ${peerId}`);
		} catch (error) {
			console.error(`[Room] Failed to create transport for peer ${peerId}:`, error);
			throw error;
		}
	} else {
		console.log(`[Room] Using existing transport for peer ${peerId}, state:`, transport.connectionState);
	}

	// If we do already have a consumer, we shouldn't have called this method
	const existingConsumer = _findConsumerForTrack(peerId, mediaTag);
	if (existingConsumer && !existingConsumer.closed) {
		console.warn("[MS] There is already an active consumer for this track", peerId, mediaTag, "ID:", existingConsumer.id);
		return;
	} else if (existingConsumer && existingConsumer.closed) {
		console.log("[MS] Found closed consumer for track, proceeding with new subscription", peerId, mediaTag);
	}

	console.log(`[Room] Subscribing to ${mediaTag} track from ${peerId}`);

	// Ask the server to create a server-side consumer object and send
	// us back the info we need to create a client-side consumer
	const device = get(deviceStore);
	if (!device) {
		throw new Error("Device not initialized");
	}

	const consumerParameters = await mediaClient.recvTrack.mutate({
		mediaTag,
		mediaPeerId: peerId,
		rtpCapabilities: device.rtpCapabilities,
	});

	console.log("[MS] Got consumer parameters:", consumerParameters);

	const consumer = await transport.consume({
		...consumerParameters,
		appData: { peerId, mediaTag },
	});

	console.log("[MS] Created new consumer:", consumer.id, "for", peerId, mediaTag);

	// The server-side consumer will be started in paused state. wait
	// until we're connected, then send a resume request to the server
	// to get our first keyframe and start displaying video
	let connectionAttempts = 0;
	const maxAttempts = 100; // 10 seconds max

	while (transport.connectionState !== "connected" && connectionAttempts < maxAttempts) {
		console.log(`[MS] Waiting for transport connection (${connectionAttempts}/${maxAttempts}), state:`, transport.connectionState);
		await _sleep(100);
		connectionAttempts++;
	}

	if (transport.connectionState !== "connected") {
		console.log("[MS] Transport connection timeout for peer " + peerId);
		consumer.close();
		throw new Error(`Transport connection timeout for peer ${peerId}`);
	}

	console.log(`[MS] Transport connected for peer ${peerId}, resuming consumer`);

	// Okay, we're ready. let's ask the peer to send us media
	try {
		await resumeConsumer(consumer);
		console.log(`[MS] Successfully resumed consumer for ${peerId} ${mediaTag}`);
	} catch (error) {
		console.error(`[MS] Failed to resume consumer for ${peerId}:`, error);
		consumer.close();
		throw error;
	}

	// Keep track of all our consumers
	consumersStore.update((consumers) => [...consumers, consumer]);
	console.log("[MS] Added consumer to store, total consumers:", get(consumersStore).length);
}

/**
 * Unsubscribe from a remote track
 * Closes the consumer for the specified peer and media
 * @param peerId - ID of the peer to unsubscribe from
 * @param mediaTag - Type of media to unsubscribe from
 */
export async function unsubscribeFromTrack(peerId: string, mediaTag: MediaTag) {
	const consumer = _findConsumerForTrack(peerId, mediaTag);
	if (!consumer) {
		console.warn("[MS] No consumer exists for this track", peerId, mediaTag);
		return;
	}
	console.log("[MS] unsubscribing from track", peerId, mediaTag);
	await closeConsumer(consumer);
}

/**
 * Get statistics about current track consumption
 * @returns Object with stats about active, paused, video, and audio consumers
 */
export function getTrackStats() {
	const consumers = get(consumersStore);
	const total = consumers.length;
	const paused = consumers.filter((c) => c.paused).length;
	const active = total - paused;
	const video = consumers.filter((c) => c.appData.mediaTag?.includes("video")).length;
	const audio = consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length;

	return {
		total,
		active,
		paused,
		video,
		audio,
	};
}

/**
 * Pause a consumer to stop receiving media
 * @param consumer - Consumer to pause
 */
export async function pauseConsumer(consumer: Consumer) {
	console.log("[MS] Pausing consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);
	await mediaClient.pauseConsumer.mutate({ consumerId: consumer.id });
	consumer.pause();
}

/**
 * Resume a paused consumer to start receiving media
 * @param consumer - Consumer to resume
 */
export async function resumeConsumer(consumer: Consumer) {
	console.log("[MS] Resuming the consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);
	await mediaClient.resumeConsumer.mutate({ consumerId: consumer.id });
	consumer.resume();
}

/**
 * Close and remove a consumer
 * @param consumer - Consumer to close
 */
export async function closeConsumer(consumer: Consumer) {
	console.log("[MS] Closing the consumer for track", consumer.appData.peerId, consumer.appData.mediaTag, "ID:", consumer.id);

	try {
		// Tell the server we're closing this consumer. (the server-side
		// consumer may have been closed already, but that's okay.)
		if (!consumer.closed) {
			await mediaClient.closeConsumer.mutate({ consumerId: consumer.id });
		}
	} catch (error) {
		console.warn("[MS] Error notifying server about consumer closure:", error);
	}

	try {
		if (!consumer.closed) {
			consumer.close();
		}
	} catch (error) {
		console.warn("[MS] Error closing consumer locally:", error);
	}

	// Remove from store regardless of errors above
	consumersStore.update((consumers) => consumers.filter(({ id }) => id !== consumer.id));
	console.log("[MS] Consumer removed from store:", consumer.id);
}

/**
 * Pause all active consumers
 */
export async function pauseAllConsumers() {
	const consumers = get(consumersStore);
	for (const consumer of consumers) {
		if (!consumer.paused) {
			await pauseConsumer(consumer);
		}
	}
}

/**
 * Resume all paused consumers
 */
export async function resumeAllConsumers() {
	const consumers = get(consumersStore);
	for (const consumer of consumers) {
		if (consumer.paused) {
			await resumeConsumer(consumer);
		}
	}
}

/**
 * Close all consumers
 */
export async function closeAllConsumers() {
	const consumers = [...get(consumersStore)];
	for (const consumer of consumers) {
		await closeConsumer(consumer);
	}
}

/**
 * Pause a producer to stop sending media
 * @param producer - Producer to pause
 */
export async function pauseProducer(producer: Producer) {
	if (!producer.paused) {
		console.log("[MS] Pausing producer for", producer.appData.mediaTag);
		await mediaClient.pauseProducer.mutate({ producerId: producer.id });
		producer.pause();
	}
}

/**
 * Resume a paused producer to start sending media
 * @param producer - Producer to resume
 */
export async function resumeProducer(producer: Producer) {
	if (producer.paused) {
		try {
			console.log("[MS]Resuming producer for", producer.appData.mediaTag);
			await mediaClient.resumeProducer.mutate({ producerId: producer.id });
			producer.resume();
		} catch (e) {
			console.error(e);
		}
	}
}

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Create a transport and hook up signaling logic
 * @param direction - Direction of transport ("send" or "recv")
 * @param peerId - Peer ID (local peer for send, remote peer for recv)
 * @returns Created transport
 */
async function _createTransport(direction: TransportDirection, peerId: string): Promise<Transport> {
	console.log(`[MS] Creating ${direction}-transport for peer ${peerId}`);

	const device = get(deviceStore);
	if (!device) {
		throw new Error("Device not initialized");
	}

	// Ask the server to create a server-side transport object and send
	// us back the info we need to create a client-side transport
	let transport: MediaSoup.types.Transport<CustomAppData>;
	const { transportOptions } = await mediaClient.createTransport.mutate({ direction });

	if (direction === "recv") {
		transport = device.createRecvTransport(transportOptions);
	} else if (direction === "send") {
		transport = device.createSendTransport(transportOptions);
	} else {
		throw new Error(`Bad transport direction: ${direction}`);
	}

	// Connect
	// mediasoup-client will emit a connect event when media needs to
	// start flowing for the first time. send dtlsParameters to the
	// server, then call resolve() on success or reject() on failure.
	transport.on("connect", (params, resolve, reject) => {
		const dtlsParameters = params.dtlsParameters;
		console.log("[MS] transport connect event", direction);

		mediaClient.connectTransport
			.mutate({
				transportId: transportOptions.id,
				dtlsParameters,
			})
			.then(resolve)
			.catch((error) => {
				console.error("[MS] Error connecting transport", direction, error);
				reject(error);
			});
	});

	// Produce
	// sending transports will emit a produce event when a new track
	// needs to be set up to start sending. the producer's appData is
	// passed as a parameter
	if (direction === "send") {
		transport.on("produce", (params, resolve, reject) => {
			const { kind, rtpParameters } = params;
			const appData = params.appData as CustomAppData;

			// FIXME: Debug logging for flatbuffers issue - remove after fixing
			console.log("[MS Debug] Full produce params:", JSON.stringify(params, null, 2));
			console.log("[MS Debug] RTP parameters:", JSON.stringify(rtpParameters, null, 2));
			console.log("[MS Debug] App data:", JSON.stringify(appData, null, 2));

			// Validate required parameters to prevent flatbuffers errors
			if (!rtpParameters || !rtpParameters.codecs || rtpParameters.codecs.length === 0) {
				console.error("[MS] Invalid RTP parameters:", rtpParameters);
				reject(new Error("Invalid RTP parameters - missing codecs"));
				return;
			}

			console.log("[MS] transport produce event", appData);

			// Respect the current paused status
			let paused = true;
			if (appData.mediaTag === "cam-video") {
				paused = get(camPausedStore);
			} else if (appData.mediaTag === "mic-audio") {
				paused = get(micPausedStore);
			}

			// Tell the server what it needs to know from us in order to set
			// up a server-side producer object, and get back a
			// producer.id.
			mediaClient.sendTrack
				.mutate({
					transportId: transportOptions.id,
					kind,
					rtpParameters,
					paused,
					appData,
				})
				.then((response) => {
					const producerId = response.id;
					resolve({ id: producerId });
				})
				.catch((error) => {
					console.error("[MS] Error setting up server-side producer", error);
					reject(error);
				});
		});
	}

	// Connection state changes
	// Any time a send transport transitions to closed it is because the connection was lost,
	// failed, or we disconnected for some other reason.
	// In this case we leave the room entirely
	// TODO: Handle this case more gracefully
	transport.on("connectionstatechange", async (state: string) => {
		console.log(`[MS] Transport ${transport.id} (peer: ${peerId}) connection state changed to ${state}`);

		if (state === "closed" || state === "failed" || state === "disconnected") {
			if (direction === "recv") {
				// For receive transports, just remove this specific peer's transport
				console.log(`[MS] Receive transport for peer ${peerId} closed`);
				recvTransports.update((t) => {
					const updated = { ...t };
					delete updated[peerId];
					return updated;
				});
				// Also close consumers for this peer
				const consumers = get(consumersStore);
				consumers.forEach((consumer) => {
					if (consumer.appData.peerId === peerId) {
						closeConsumer(consumer);
					}
				});
			} else if (direction === "send") {
				// For send transport, leave the room entirely
				console.log("[MS] Send transport closed... leaving the room and resetting");
				leaveMediaRoom();
			}
		}
	});

	// Return the transport
	return transport;
}

/**
 * Find a consumer matching the given peer and media tag
 * @param peerId - Peer ID to search for
 * @param mediaTag - Media tag to search for
 * @returns Matching consumer or undefined
 */
function _findConsumerForTrack(peerId: string, mediaTag: MediaTag): Consumer | undefined {
	const consumers = get(consumersStore);
	return consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

/**
 * Sort peers by join time
 * @param peers - Map of peers to sort
 * @returns Array of peers sorted by join timestamp
 */
function _sortPeers(peers: Record<string, Peer>): Array<Peer> {
	return Object.values(peers); // TODO: fix, joinedTS was moved to session!
}

/**
 * Sleep utility for async delays
 * @param ms - Milliseconds to sleep
 */
async function _sleep(ms: number) {
	return new Promise<void>((r) => setTimeout(() => r(), ms));
}
