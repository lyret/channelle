/**
 * State computation functions for peer media management
 * Contains core logic for determining peer states and permissions
 */

import type { ClientPeerAttributes } from "~/types/serverSideTypes";

/**
 * Check if a peer is in the stage layout
 */
export function isPeerInLayout(peerId: string, stageLayout: any): boolean {
	if (!peerId || !stageLayout) return false;

	// In auto layout mode, no specific peers are in the layout
	if (stageLayout.isAutoLayout) {
		return false;
	}

	// In manual layout mode, check if peer is in the layout matrix
	const layout = stageLayout.layout || [];
	for (const row of layout) {
		for (const cell of row) {
			if (cell.type === "actor" && cell.peerId === peerId) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Determine if peer is on stage (in layout and curtains open)
 */
export function isPeerOnStage(peer: ClientPeerAttributes, isInLayout: boolean, sceneSettings: any): boolean {
	// Actors and managers are on stage if they're in the layout and curtains are open
	if ((peer.actor || peer.manager) && isInLayout && !sceneSettings?.curtains) {
		return true;
	}

	// In auto layout mode with curtains open, actors/managers are considered on stage
	if ((peer.actor || peer.manager) && sceneSettings?.autoLayout && !sceneSettings?.curtains) {
		return true;
	}

	return false;
}

/**
 * Determine media permissions based on role and scene settings
 */
export function getMediaPermissions(
	peer: ClientPeerAttributes,
	isOnStage: boolean,
	sceneSettings: any,
): { audioAllowed: boolean; videoAllowed: boolean } {
	// Database mute states override all permissions
	if (peer.audioMuted || peer.videoMuted) {
		return {
			audioAllowed: !peer.audioMuted,
			videoAllowed: !peer.videoMuted,
		};
	}

	// Actors and managers have permissions when on stage
	if (peer.actor || peer.manager) {
		return {
			audioAllowed: isOnStage,
			videoAllowed: isOnStage,
		};
	}

	// Visitors depend on scene settings
	return {
		audioAllowed: sceneSettings?.visitorAudioEnabled || false,
		videoAllowed: sceneSettings?.visitorVideoEnabled || false,
	};
}
