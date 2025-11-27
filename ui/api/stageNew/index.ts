/**
 * Simplified Stage API
 * Event-driven media room management with automatic stream handling
 */

// ============================================================================
// MAIN EXPORTS FROM ROOM MANAGER
// ============================================================================

export {
	// Room connection
	participateInTheMediaRoom,

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

	// Debug access to internal state
	roomState,
} from "./roomManager";

// ============================================================================
// RE-EXPORT TYPES
// ============================================================================

export type { MediaTag, ActiveSpeaker, MediaSession } from "~/types/serverSideTypes";
