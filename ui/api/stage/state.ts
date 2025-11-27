/**
 * Unified state manager for stage media streaming
 * Centralizes all media-related state to reduce store proliferation and get() calls
 */
import { writable, derived, readable, get } from "svelte/store";
import type * as MediaSoup from "mediasoup-client";
import type { CustomAppData, ActiveSpeaker } from "~/types/serverSideTypes";
import { currentPeerStore } from "../auth";
import { stageClient } from "../_trpcClient";

// Type aliases
type Transport = MediaSoup.types.Transport<CustomAppData>;
type Consumer = MediaSoup.types.Consumer<CustomAppData>;
type Producer = MediaSoup.types.Producer<CustomAppData>;
type Device = MediaSoup.types.Device;

// ============================================================================
// MAIN STATE INTERFACE
// ============================================================================

export interface MediaState {
	// Loading & Error
	isLoading: boolean;
	error: string | null;

	// MediaSoup
	device: Device | null;

	// Local Media
	localStream: MediaStream | null;
	camPaused: boolean;
	micPaused: boolean;

	// Transports
	sendTransport: Transport | null;
	recvTransports: Record<string, Transport>;

	// Producers & Consumers
	videoProducer: Producer | null;
	audioProducer: Producer | null;
	consumers: Consumer[];

	// Sessions
	sessions: Record<string, any>;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: MediaState = {
	isLoading: false,
	error: null,
	device: null,
	localStream: null,
	camPaused: false,
	micPaused: false,
	sendTransport: null,
	recvTransports: {},
	videoProducer: null,
	audioProducer: null,
	consumers: [],
	sessions: {},
};

// ============================================================================
// MAIN STATE STORE
// ============================================================================

/**
 * Main writable store containing all media state
 */
const mediaStateStore = writable<MediaState>(initialState);

// ============================================================================
// STATE ACCESS FUNCTIONS (No get() needed)
// ============================================================================

/**
 * Get current state snapshot (for one-time reads in async functions)
 */
export function getState(): MediaState {
	return get(mediaStateStore);
}

/**
 * Update state partially
 */
export function updateState(updates: Partial<MediaState>): void {
	mediaStateStore.update((state) => ({ ...state, ...updates }));
}

/**
 * Reset state to initial values
 */
export function resetState(): void {
	mediaStateStore.set(initialState);
}

// ============================================================================
// SPECIFIC STATE UPDATERS
// ============================================================================

/**
 * Set loading state
 */
export function setLoading(isLoading: boolean): void {
	mediaStateStore.update((state) => ({ ...state, isLoading }));
}

/**
 * Set error message
 */
export function setError(error: string | null): void {
	mediaStateStore.update((state) => ({ ...state, error }));
}

/**
 * Set MediaSoup device
 */
export function setDevice(device: Device | null): void {
	mediaStateStore.update((state) => ({ ...state, device }));
}

/**
 * Set local media stream
 */
export function setLocalStream(localStream: MediaStream | null): void {
	mediaStateStore.update((state) => ({ ...state, localStream }));
}

/**
 * Set camera paused state
 */
export function setCamPaused(camPaused: boolean): void {
	mediaStateStore.update((state) => ({ ...state, camPaused }));
}

/**
 * Set microphone paused state
 */
export function setMicPaused(micPaused: boolean): void {
	mediaStateStore.update((state) => ({ ...state, micPaused }));
}

/**
 * Set send transport
 */
export function setSendTransport(sendTransport: Transport | null): void {
	mediaStateStore.update((state) => ({ ...state, sendTransport }));
}

/**
 * Update receive transports
 */
export function updateRecvTransports(updater: (transports: Record<string, Transport>) => Record<string, Transport>): void {
	mediaStateStore.update((state) => ({
		...state,
		recvTransports: updater(state.recvTransports),
	}));
}

/**
 * Set receive transport for a peer
 */
export function setRecvTransport(peerId: string, transport: Transport | null): void {
	mediaStateStore.update((state) => {
		const recvTransports = { ...state.recvTransports };
		if (transport) {
			recvTransports[peerId] = transport;
		} else {
			delete recvTransports[peerId];
		}
		return { ...state, recvTransports };
	});
}

/**
 * Set video producer
 */
export function setVideoProducer(videoProducer: Producer | null): void {
	mediaStateStore.update((state) => ({ ...state, videoProducer }));
}

/**
 * Set audio producer
 */
export function setAudioProducer(audioProducer: Producer | null): void {
	mediaStateStore.update((state) => ({ ...state, audioProducer }));
}

/**
 * Update consumers list
 */
export function updateConsumers(updater: (consumers: Consumer[]) => Consumer[]): void {
	mediaStateStore.update((state) => ({
		...state,
		consumers: updater(state.consumers),
	}));
}

/**
 * Add a consumer
 */
export function addConsumer(consumer: Consumer): void {
	mediaStateStore.update((state) => ({
		...state,
		consumers: [...state.consumers, consumer],
	}));
}

/**
 * Remove a consumer
 */
export function removeConsumer(consumerId: string): void {
	mediaStateStore.update((state) => ({
		...state,
		consumers: state.consumers.filter((c) => c.id !== consumerId),
	}));
}

/**
 * Set sessions
 */
export function setSessions(sessions: Record<string, any>): void {
	mediaStateStore.update((state) => ({ ...state, sessions }));
}

// ============================================================================
// SPECIALIZED GETTERS (for complex operations)
// ============================================================================

/**
 * Get transport for a specific peer
 */
export function getRecvTransport(peerId: string): Transport | undefined {
	const state = getState();
	return state.recvTransports[peerId];
}

/**
 * Get consumer by peer ID and media tag
 */
export function findConsumer(peerId: string, mediaTag: string): Consumer | undefined {
	const state = getState();
	return state.consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

/**
 * Get consumers for a specific peer
 */
export function getConsumersByPeer(peerId: string): Consumer[] {
	const state = getState();
	return state.consumers.filter((c) => c.appData.peerId === peerId);
}

/**
 * Check if we have any active producers
 */
export function hasActiveProducers(): boolean {
	const state = getState();
	return !!(state.videoProducer || state.audioProducer);
}

/**
 * Get video track from local stream
 */
export function getLocalVideoTrack(): MediaStreamTrack | null {
	const state = getState();
	if (!state.localStream) return null;
	const tracks = state.localStream.getVideoTracks();
	return tracks.length > 0 ? tracks[0] : null;
}

/**
 * Get audio track from local stream
 */
export function getLocalAudioTrack(): MediaStreamTrack | null {
	const state = getState();
	if (!state.localStream) return null;
	const tracks = state.localStream.getAudioTracks();
	return tracks.length > 0 ? tracks[0] : null;
}

// ============================================================================
// DERIVED STORES (for reactive UI)
// ============================================================================

/**
 * Loading state store
 */
export const mediaRoomIsLoading = derived(mediaStateStore, ($state) => $state.isLoading);

/**
 * Error message store
 */
export const mediaRoomError = derived(mediaStateStore, ($state) => $state.error);

/**
 * Device store
 */
export const deviceStore = derived(mediaStateStore, ($state) => $state.device);

/**
 * Local media stream store
 */
export const localMediaStreamStore = derived(mediaStateStore, ($state) => $state.localStream);

/**
 * Camera paused state
 */
export const camPausedStore = derived(mediaStateStore, ($state) => $state.camPaused);

/**
 * Microphone paused state
 */
export const micPausedStore = derived(mediaStateStore, ($state) => $state.micPaused);

/**
 * Send transport store
 */
export const sendTransportStore = derived(mediaStateStore, ($state) => $state.sendTransport);

/**
 * Receive transports store
 */
export const recvTransports = derived(mediaStateStore, ($state) => $state.recvTransports);

/**
 * Video producer store
 */
export const videoProducerStore = derived(mediaStateStore, ($state) => $state.videoProducer);

/**
 * Audio producer store
 */
export const audioProducerStore = derived(mediaStateStore, ($state) => $state.audioProducer);

/**
 * Consumers store
 */
export const consumersStore = derived(mediaStateStore, ($state) => $state.consumers);

/**
 * Sessions store
 */
export const sessionsStore = derived(mediaStateStore, ($state) => $state.sessions);

/**
 * Has local camera/media stream
 */
export const hasLocalCamStore = derived(mediaStateStore, ($state) => !!$state.localStream);

/**
 * Has send transport
 */
export const hasSendTransportStore = derived(mediaStateStore, ($state) => !!$state.sendTransport);

/**
 * Has receive transports
 */
export const hasRecvTransportStore = derived(mediaStateStore, ($state) => Object.keys($state.recvTransports).length > 0);

// ============================================================================
// ACTIVE SPEAKER (separate subscription)
// ============================================================================

/**
 * Currently active speaker in the room
 * Updated periodically through room sync
 */
export const currentActiveSpeakerStore = readable<ActiveSpeaker | null>(null, (set) => {
	const { unsubscribe } = stageClient.activeSpeaker.subscribe(undefined, {
		onData: (activeSpeaker) => {
			set(activeSpeaker);
		},
	});
	return unsubscribe;
});

// ============================================================================
// AUTH-RELATED DERIVED STORES
// ============================================================================

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up all media resources and reset state
 */
export function cleanupMediaState(): void {
	const state = getState();

	// Close all transports
	state.sendTransport?.close();
	Object.values(state.recvTransports).forEach((transport) => transport.close());

	// Stop local stream tracks
	state.localStream?.getTracks().forEach((track) => track.stop());

	// Close all consumers
	state.consumers.forEach((consumer) => consumer.close());

	// Reset state
	resetState();
}
