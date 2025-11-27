/**
 * Stage API - Media streaming and WebRTC functionality
 * This module provides all the functionality for stage media streaming,
 * including WebRTC transport management, media production/consumption,
 * and real-time synchronization with the server.
 */

// ============================================================================
// STORES
// ============================================================================

export {
	// Loading and error state
	mediaRoomIsLoading,
	mediaRoomError,

	// MediaSoup device
	deviceStore,

	// Local media controls
	camPausedStore,
	micPausedStore,
	localMediaStreamStore,

	// Transports
	recvTransports,
	sendTransportStore,

	// Producers and consumers
	videoProducerStore,
	audioProducerStore,
	consumersStore,

	// Session and room state
	sessionsStore,
	currentActiveSpeakerStore,

	// Derived stores
	hasAutenticated,
	isBannedFromTheRoom,
	hasLocalCamStore,
	hasSendTransportStore,
	hasRecvTransportStore,
} from "./stores";

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

export {
	subscribeToTrack,
	unsubscribeFromTrack,
	pauseConsumer,
	resumeConsumer,
	closeConsumer,
	pauseAllConsumers,
	resumeAllConsumers,
	closeAllConsumers,
	pauseProducer,
	resumeProducer,
} from "./consumer";

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

export { getDebugState, logDebugState, getTrackStats } from "./debug";

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
	DebugState,
	TrackStats,
} from "./types";

// ============================================================================
// UTILITY FUNCTIONS (for advanced use cases)
// ============================================================================

export {
	findConsumerForTrack,
	sleep,
	endMediaParticipation,
	checkStreamTracks,
	stopStreamTracks,
	getVideoTrack,
	getAudioTrack,
	isConsumerActive,
	getMediaConstraints,
} from "./utils";

// ============================================================================
// TRANSPORT MANAGEMENT (for advanced use cases)
// ============================================================================

export { createTransport, closeTransport, getTransportStats, restartTransportIce } from "./transport";
