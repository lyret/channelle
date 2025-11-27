/**
 * Stage API - Media streaming and WebRTC functionality
 * This module provides all the functionality for stage media streaming,
 * including WebRTC transport management, media production/consumption,
 * and real-time synchronization with the server.
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export {
	// State access functions
	getState,
	updateState,
	resetState,
	cleanupMediaState,

	// State setters
	setLoading,
	setError,
	setDevice,
	setLocalStream,
	setCamPaused,
	setMicPaused,
	setSendTransport,
	setRecvTransport,
	updateRecvTransports,
	setVideoProducer,
	setAudioProducer,
	updateConsumers,
	addConsumer,
	removeConsumer,
	setSessions,

	// State getters
	getRecvTransport,
	findConsumer,
	getConsumersByPeer,
	hasActiveProducers,
	getLocalVideoTrack,
	getLocalAudioTrack,

	// Derived stores (for Svelte components)
	mediaRoomIsLoading,
	mediaRoomError,
	deviceStore,
	localMediaStreamStore,
	camPausedStore,
	micPausedStore,
	sendTransportStore,
	recvTransports,
	videoProducerStore,
	audioProducerStore,
	consumersStore,
	sessionsStore,
	hasLocalCamStore,
	hasSendTransportStore,
	hasRecvTransportStore,
	currentActiveSpeakerStore,
	hasAutenticated,
	isBannedFromTheRoom,
} from "./state";

// ============================================================================
// MEDIA ROOM PARTICIPATION
// ============================================================================

export { participateInTheMediaRoom, leaveMediaRoom, getMediaRoomStatus, isParticipating } from "./mediaRoom";

// ============================================================================
// LOCAL MEDIA CONTROL
// ============================================================================

export { startVideo, enableAudio, disableVideo, disableAudio, toggleVideoPaused, toggleAudioPaused, closeMediaStreams } from "./localMedia";

// ============================================================================
// CONSUMER MANAGEMENT
// ============================================================================

export { subscribeToTrack, unsubscribeFromTrack, closeConsumer } from "./consumer";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type {
	// MediaSoup types
	Transport,
	Consumer,
	Producer,
	Device,

	// Server types
	CustomAppData,
	MediaTag,
	TransportDirection,
	ActiveSpeaker,
	MediaSession,

	// Stage client types
	AsyncResult,
	MediaStreamConfig,
	TransportOptions,
	ConsumerParameters,
	ProducerOptions,
	PeerSession,
} from "./types";

// ============================================================================
// UTILITY FUNCTIONS (for advanced use cases)
// ============================================================================

export { sleep, endMediaParticipation, checkStreamTracks, stopStreamTracks, isConsumerActive, getMediaConstraints } from "./utils";

// ============================================================================
// TRANSPORT MANAGEMENT (for advanced use cases)
// ============================================================================

export { createTransport, closeTransport } from "./transport";
