/**
 * Unified state manager for stage media streaming
 * Centralizes all media-related state to reduce store proliferation and get() calls
 */
import { writable, derived, get } from "svelte/store";
import type * as MediaSoup from "mediasoup-client";
import type { CustomAppData } from "~/types/serverSideTypes";

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

/**
 * Main writable store containing all media state
 */
const mediaStateStore = writable<MediaState>(initialState);

/**
 * Local media stream store
 */
export const localMediaStreamStore = derived(mediaStateStore, ($state) => $state.localStream);

/**
 * Video producer store
 */
export const videoProducerStore = derived(mediaStateStore, ($state) => $state.videoProducer);

/**
 * Audio producer store
 */
export const audioProducerStore = derived(mediaStateStore, ($state) => $state.audioProducer);

/**
 * Camera paused state
 */
export const camPausedStore = derived(mediaStateStore, ($state) => $state.camPaused);

/**
 * Microphone paused state
 */
export const micPausedStore = derived(mediaStateStore, ($state) => $state.micPaused);

/**
 * Get current state snapshot (for one-time reads in async functions)
 */
export function getState(): MediaState {
	return get(mediaStateStore);
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
