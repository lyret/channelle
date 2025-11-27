/**
 * Svelte stores for stage media streaming state management
 */
import { writable, derived, readable } from "svelte/store";
import type * as MediaSoup from "mediasoup-client";
import type { CustomAppData, ActiveSpeaker } from "~/types/serverSideTypes";
import { currentPeerStore } from "../auth";
import { stageClient } from "../_trpcClient";

// Type aliases for cleaner code
type Transport = MediaSoup.types.Transport<CustomAppData>;
type Consumer = MediaSoup.types.Consumer<CustomAppData>;
type Producer = MediaSoup.types.Producer<CustomAppData>;

// ============================================================================
// LOADING & ERROR STATE
// ============================================================================

/** Loading state for media room sync operations */
export const mediaRoomIsLoading = writable<boolean>(false);

/** Error messages from the media room sync operations */
export const mediaRoomError = writable<string | null>(null);

// ============================================================================
// MEDIASOUP DEVICE
// ============================================================================

/**
 * MediaSoup device - initialized when joining media room with router RTP capabilities
 * Contains codec information and WebRTC capabilities
 */
export const deviceStore = writable<MediaSoup.types.Device | null>(null);

// ============================================================================
// LOCAL MEDIA CONTROL
// ============================================================================

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
export const localMediaStreamStore = writable<MediaStream | null>(null);

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
export const sendTransportStore = writable<Transport | null>(null);

// ============================================================================
// PRODUCER & CONSUMER STORES
// ============================================================================

/**
 * Local video producer - sends video to other participants
 * Created when local video stream is being produced
 */
export const videoProducerStore = writable<Producer | null>(null);

/**
 * Local audio producer - sends audio to other participants
 * Created when local audio stream is being produced
 */
export const audioProducerStore = writable<Producer | null>(null);

/**
 * List of all active consumers for receiving remote media
 * Each consumer represents a remote track being received
 */
export const consumersStore = writable<Consumer[]>([]);

// ============================================================================
// SESSION & ROOM STATE
// ============================================================================

/**
 * Map of all peer sessions with their media availability and stats
 * Updated periodically through room sync
 */
export const sessionsStore = writable<Record<string, any>>({});

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
// DERIVED STORES
// ============================================================================

/**
 * Indicates whether the client has successfully joined the room
 */
export const hasAutenticated = derived([currentPeerStore], ([$peer]) => {
	return Object.keys($peer).length > 0;
});

/**
 * Indicates whether the client is banned from the room
 */
export const isBannedFromTheRoom = derived([currentPeerStore], ([$peer]) => {
	return $peer && $peer.banned;
});

/**
 * Whether local camera/media stream is available
 * True when getUserMedia has successfully provided a media stream
 */
export const hasLocalCamStore = derived(localMediaStreamStore, ($localCam) => !!$localCam);

/**
 * Whether send transport is available for outgoing media
 * True when WebRTC transport is ready to send local streams
 */
export const hasSendTransportStore = derived(sendTransportStore, ($transport) => !!$transport);

/**
 * Whether any receive transports are available for incoming media
 * True when at least one peer connection is established for receiving
 */
export const hasRecvTransportStore = derived(recvTransports, ($transports) => Object.keys($transports).length > 0);
