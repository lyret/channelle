/**
 * Type definitions for peer media state management
 */

/**
 * Core media state for a peer
 */
export interface PeerMediaState {
	// Peer identity
	peerId: string;
	name: string;
	isCurrentPeer: boolean;

	// Role
	isActor: boolean;
	isManager: boolean;
	isVisitor: boolean;

	// Status
	isOnline: boolean;
	isBanned: boolean;

	// Stage positioning
	isOnStage: boolean;
	isInLayout: boolean;
	curtainsActive: boolean;
	isAutoLayout: boolean;

	// Media permissions (based on role and scene settings)
	audioAllowed: boolean;
	videoAllowed: boolean;

	// Mute states (from database)
	audioMuted: boolean;
	videoMuted: boolean;

	// Local media tracks
	hasLocalAudioTrack: boolean;
	hasLocalVideoTrack: boolean;

	// Transmission states
	isTransmittingAudio: boolean;
	isTransmittingVideo: boolean;

	// Reception states
	isReceivingAudio: boolean;
	isReceivingVideo: boolean;

	// Scene settings context
	visitorAudioEnabled: boolean;
	visitorVideoEnabled: boolean;
}

/**
 * Media button state for UI components
 */
export interface MediaButtonState {
	enabled: boolean;
	active: boolean;
	allowed: boolean;
	transmitting: boolean;
	received: boolean;
}

/**
 * Debug information for media state
 */
export interface MediaDebugInfo {
	myPeerId: string;
	isOnStage: boolean;
	isTransmittingAudio: boolean;
	isTransmittingVideo: boolean;
	localStreamTracks: {
		audio: number;
		video: number;
	};
	producers: {
		audio: boolean;
		video: boolean;
	};
	permissions: {
		audioAllowed: boolean;
		videoAllowed: boolean;
	};
}
