/**
 * Store definitions for peer media state management
 * Provides reactive stores for tracking media states and UI states
 */

import { derived, writable } from "svelte/store";
import type { Readable, Writable } from "svelte/store";
import { wsPeerIdStore } from "~/api/_trpcClient";
import { showPeersStore } from "~/api/backstage";
import { calculatedStageLayoutStore } from "~/stores/stage/stageLayoutStore";
import { showSceneSettingsStore } from "~/api/backstage";
import { peerStreamsStore, sessionsStore } from "~/api/stageNew";
import { videoProducerStore, audioProducerStore, micPausedStore, camPausedStore } from "~/api/stage";
import type { PeerMediaState, MediaButtonState, MediaDebugInfo } from "./peerMediaTypes";
import { isPeerInLayout, isPeerOnStage, getMediaPermissions } from "./peerMediaStateComputation";

/**
 * Store for tracking debug information
 */
export const mediaDebugStore: Writable<MediaDebugInfo | null> = writable(null);

/**
 * Create a derived store for a specific peer's media state
 */
export function createPeerMediaStateStore(peerId: string): Readable<PeerMediaState | null> {
	return derived(
		[
			wsPeerIdStore,
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
		([$myPeerId, $showPeersStore, $stageLayout, $sceneSettings, $peerStreams, $sessions, $videoProducer, $audioProducer, $micPaused, $camPaused]) => {
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

				// Update debug info for current peer
				mediaDebugStore.set({
					myPeerId: peerId,
					isOnStage,
					isTransmittingAudio,
					isTransmittingVideo,
					localStreamTracks: {
						audio: hasLocalAudioTrack ? 1 : 0,
						video: hasLocalVideoTrack ? 1 : 0,
					},
					producers: {
						audio: hasAudioProducer,
						video: hasVideoProducer,
					},
					permissions: {
						audioAllowed: permissions.audioAllowed,
						videoAllowed: permissions.videoAllowed,
					},
				});
			} else {
				// For remote peers, check session media
				isTransmittingAudio = peerSession?.media?.["mic-audio"] || false;
				isTransmittingVideo = peerSession?.media?.["cam-video"] || false;
			}

			// Reception states
			const isReceivingAudio = isCurrentPeer ? (peerSession?.media?.["mic-audio"] ? true : false) : hasLocalAudioTrack;
			const isReceivingVideo = isCurrentPeer ? (peerSession?.media?.["cam-video"] ? true : false) : hasLocalVideoTrack;

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

/**
 * Convenience store for current peer's media state (alias for localPeerMediaState)
 */
export const currentPeerMediaStateStore = localPeerMediaState;

/**
 * Derived store for audio permission status
 */
export const isAudioAllowedStore = derived(localPeerMediaState, ($mediaState) => $mediaState?.audioAllowed ?? false) as Readable<boolean>;

/**
 * Derived store for video permission status
 */
export const isVideoAllowedStore = derived(localPeerMediaState, ($mediaState) => $mediaState?.videoAllowed ?? false) as Readable<boolean>;

/**
 * Derived store for both audio and video permissions
 */
export const mediaPermissionsStore = derived(localPeerMediaState, ($mediaState) => ({
	audio: $mediaState?.audioAllowed ?? false,
	video: $mediaState?.videoAllowed ?? false,
})) as Readable<{ audio: boolean; video: boolean }>;

/**
 * Derived store for audio button state
 */
export const audioButtonStateStore = derived(localPeerMediaState, ($mediaState): MediaButtonState => {
	if (!$mediaState) {
		return {
			enabled: false,
			active: false,
			allowed: false,
			transmitting: false,
			received: false,
		};
	}

	return {
		enabled: $mediaState.audioAllowed,
		active: !$mediaState.audioMuted,
		allowed: $mediaState.audioAllowed,
		transmitting: $mediaState.isTransmittingAudio,
		received: $mediaState.isReceivingAudio,
	};
}) as Readable<MediaButtonState>;

/**
 * Derived store for video button state
 */
export const videoButtonStateStore = derived(localPeerMediaState, ($mediaState): MediaButtonState => {
	if (!$mediaState) {
		return {
			enabled: false,
			active: false,
			allowed: false,
			transmitting: false,
			received: false,
		};
	}

	return {
		enabled: $mediaState.videoAllowed,
		active: !$mediaState.videoMuted,
		allowed: $mediaState.videoAllowed,
		transmitting: $mediaState.isTransmittingVideo,
		received: $mediaState.isReceivingVideo,
	};
}) as Readable<MediaButtonState>;
