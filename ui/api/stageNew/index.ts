/**
 * Simplified Stage API
 * Event-driven media room management with automatic stream handling
 */

// ============================================================================
// MAIN EXPORTS FROM ROOM MANAGER
// ============================================================================

export {
	// Room connection
	joinRoom,
	leaveRoom,

	// Local media control
	enableCamera,
	disableCamera,
	enableMicrophone,
	disableMicrophone,

	// Reactive stores for components
	peerStreamsStore,
	sessionsStore,
	activeSpeakerStore,
	isLoadingStore,
	errorStore,

	// Utility functions
	getMediaStream,
} from "./roomManager";

// ============================================================================
// RE-EXPORT TYPES
// ============================================================================

export type {
	MediaTag,
	ActiveSpeaker,
	MediaSession,
} from "~/types/serverSideTypes";
