/**
 * Peer Media State Management
 * Provides media state computation and stores for peer media tracking
 */

import { derived } from "svelte/store";
import type { Readable } from "svelte/store";
import type { ClientPeerAttributes } from "~/types/serverSideTypes";
import { calculatedStageLayoutStore } from "~/stores/stage/stageLayoutStore";
import { showSceneSettingsStore } from "~/api/backstage";
import { peerStreamsStore, sessionsStore } from "~/api/stageNew";
import { showPeersStore } from "~/api/backstage";
import { currentPeerStore } from "~/api/auth";
import { wsPeerIdStore } from "~/api/_trpcClient";
import { videoProducerStore, audioProducerStore, micPausedStore, camPausedStore } from "~/api/stage";

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
 * Check if a peer is in the stage layout
 */
function isPeerInLayout(peerId: string, stageLayout: any): boolean {
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
function isPeerOnStage(peer: ClientPeerAttributes, isInLayout: boolean, sceneSettings: any): boolean {
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
function getMediaPermissions(peer: ClientPeerAttributes, isOnStage: boolean, sceneSettings: any): { audioAllowed: boolean; videoAllowed: boolean } {
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

/**
 * Create a derived store for a specific peer's media state
 */
export function createPeerMediaStateStore(peerId: string): Readable<PeerMediaState | null> {
	return derived(
		[
			wsPeerIdStore,
			currentPeerStore,
			showPeersStore,
			calculatedStageLayoutStore,
			showSceneSettingsStore,
			peerStreamsStore,
			sessionsStore,
			videoProducerStore,
			audioProducerStore,
			micPausedStore,
			camPausedStore,
		],
		([
			$myPeerId,
			$currentPeer,
			$showPeersStore,
			$stageLayout,
			$sceneSettings,
			$peerStreams,
			$sessions,
			$videoProducer,
			$audioProducer,
			$micPaused,
			$camPaused,
		]) => {
			// Find the peer
			const peer = $showPeersStore[peerId];
			if (!peer) return null;

			const isCurrentPeer = peerId === $myPeerId;

			// Check if in layout and on stage
			const isInLayout = isPeerInLayout(peerId, $stageLayout);
			const isOnStage = isPeerOnStage(peer, isInLayout, $sceneSettings);

			// Get permissions
			const permissions = getMediaPermissions(peer, isOnStage, $sceneSettings);

			// Get stream data
			const peerStream = $peerStreams[peerId];
			const peerSession = $sessions[peerId];

			// Local media tracks
			const hasLocalAudioTrack = (peerStream?.getAudioTracks().length || 0) > 0;
			const hasLocalVideoTrack = (peerStream?.getVideoTracks().length || 0) > 0;

			// Transmission states
			let isTransmittingAudio = false;
			let isTransmittingVideo = false;

			if (isCurrentPeer) {
				// For current peer, check producers
				const hasAudioProducer = !!$audioProducer && !$audioProducer.closed;
				const hasVideoProducer = !!$videoProducer && !$videoProducer.closed;
				isTransmittingAudio = hasLocalAudioTrack && hasAudioProducer && !$micPaused;
				isTransmittingVideo = hasLocalVideoTrack && hasVideoProducer && !$camPaused;
			} else {
				// For remote peers, check session media
				isTransmittingAudio = peerSession?.media?.["mic-audio"] || false;
				isTransmittingVideo = peerSession?.media?.["cam-video"] || false;
			}

			// Reception states
			const isReceivingAudio = isCurrentPeer ? peerSession?.audioAvailable || false : hasLocalAudioTrack;
			const isReceivingVideo = isCurrentPeer ? peerSession?.videoAvailable || false : hasLocalVideoTrack;

			return {
				// Peer identity
				peerId,
				name: peer.name,
				isCurrentPeer,

				// Role
				isActor: peer.actor,
				isManager: peer.manager,
				isVisitor: !peer.actor && !peer.manager,

				// Status
				isOnline: peer.online,
				isBanned: peer.banned,

				// Stage positioning
				isOnStage,
				isInLayout,
				curtainsActive: $sceneSettings?.curtains || false,
				isAutoLayout: $stageLayout?.isAutoLayout || false,

				// Media permissions
				audioAllowed: permissions.audioAllowed,
				videoAllowed: permissions.videoAllowed,

				// Mute states
				audioMuted: peer.audioMuted,
				videoMuted: peer.videoMuted,

				// Local media tracks
				hasLocalAudioTrack,
				hasLocalVideoTrack,

				// Transmission states
				isTransmittingAudio,
				isTransmittingVideo,

				// Reception states
				isReceivingAudio,
				isReceivingVideo,

				// Scene settings context
				visitorAudioEnabled: $sceneSettings?.visitorAudioEnabled || false,
				visitorVideoEnabled: $sceneSettings?.visitorVideoEnabled || false,
			};
		},
	) as Readable<PeerMediaState | null>;
}

/**
 * Store cache for peer media state stores
 */
const peerMediaStateStoreCache = new Map<string, Readable<PeerMediaState | null>>();

/**
 * Get or create a peer media state store (with caching)
 */
export function getPeerMediaStateStore(peerId: string): Readable<PeerMediaState | null> {
	if (!peerMediaStateStoreCache.has(peerId)) {
		peerMediaStateStoreCache.set(peerId, createPeerMediaStateStore(peerId));
	}
	return peerMediaStateStoreCache.get(peerId)!;
}

/**
 * Clear cache for a specific peer
 */
export function clearPeerMediaStateCache(peerId: string): void {
	peerMediaStateStoreCache.delete(peerId);
}

/**
 * Clear entire cache
 */
export function clearAllPeerMediaStateCache(): void {
	peerMediaStateStoreCache.clear();
}

/**
 * Convenience store for current peer's media state
 */
export const currentPeerMediaStateStore = derived([wsPeerIdStore], ([$peerId]) => {
	if (!$peerId) return null;
	return getPeerMediaStateStore($peerId);
}) as Readable<Readable<PeerMediaState | null> | null>;

/**
 * Flattened store for the local user's media state
 * This can be used directly in components without creating additional stores
 */
export const localPeerMediaState = derived(
	[wsPeerIdStore],
	([$peerId], set) => {
		if (!$peerId) {
			set(null);
			return;
		}

		// Get the store for the current peer
		const peerStore = getPeerMediaStateStore($peerId);

		// Subscribe to it and flatten the value
		const unsubscribe = peerStore.subscribe((state) => {
			set(state);
		});

		// Return cleanup function
		return unsubscribe;
	},
	null as PeerMediaState | null,
) as Readable<PeerMediaState | null>;
