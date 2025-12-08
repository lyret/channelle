/**
 * Peer Media State Management
 * Exports all functionality from modular files in the stageNew directory
 *
 * This file maintains backward compatibility while the actual implementation
 * is split into multiple files for better organization:
 * - peerMediaTypes.ts - Type definitions
 * - peerMediaStateComputation.ts - Core logic functions
 * - peerMediaStores.ts - Reactive store definitions
 * - muteEnforcement.ts - Media enforcement logic (mute states and permissions)
 */

// Export types
export type { PeerMediaState, MediaButtonState, MediaDebugInfo } from "./peerMediaTypes";

// Export state computation functions
export { isPeerInLayout, isPeerOnStage, getMediaPermissions } from "./peerMediaStateComputation";

// Export stores
export {
	// Core stores
	mediaDebugStore,
	createPeerMediaStateStore,
	getPeerMediaStateStore,
	clearPeerMediaStateCache,
	clearAllPeerMediaStateCache,

	// Current peer stores
	localPeerMediaState,
	currentPeerMediaStateStore,

	// Permission stores
	isAudioAllowedStore,
	isVideoAllowedStore,
	mediaPermissionsStore,

	// UI button state stores
	audioButtonStateStore,
	videoButtonStateStore,
} from "./peerMediaStores";

// Export media enforcement (handles both mute states and permissions)
export { startMuteEnforcement, stopMuteEnforcement } from "./muteEnforcement";
