/**
 * Mute enforcement functionality
 * Monitors peer mute state and enforces stream stopping when muted via database
 */

import { currentPeerStore } from "~/api/auth";
import { disableCamera, disableMicrophone } from "~/api/stageNew";
import { getLocalVideoTrack, getLocalAudioTrack } from "~/api/stage";

// Track enforcement state
let muteEnforcementUnsubscribe: (() => void) | null = null;
let previousAudioMuted: boolean | null = null;
let previousVideoMuted: boolean | null = null;

/**
 * Stop audio stream when muted
 */
async function stopAudioStream(): Promise<void> {
	try {
		// Stop microphone
		await disableMicrophone();

		// Ensure local track is stopped
		const audioTrack = getLocalAudioTrack();
		if (audioTrack) {
			audioTrack.stop();
			console.log("[MuteEnforcement] Audio track stopped");
		}
	} catch (error) {
		console.error("[MuteEnforcement] Failed to stop audio stream:", error);
	}
}

/**
 * Stop video stream when muted
 */
async function stopVideoStream(): Promise<void> {
	try {
		// Stop camera
		await disableCamera();

		// Ensure local track is stopped
		const videoTrack = getLocalVideoTrack();
		if (videoTrack) {
			videoTrack.stop();
			console.log("[MuteEnforcement] Video track stopped");
		}
	} catch (error) {
		console.error("[MuteEnforcement] Failed to stop video stream:", error);
	}
}

/**
 * Start monitoring peer mute state and enforce stream stopping
 * This subscribes to the currentPeerStore directly to handle mute enforcement
 */
export function startMuteEnforcement(): void {
	// Subscribe to current peer changes for mute enforcement
	muteEnforcementUnsubscribe = currentPeerStore.subscribe(async (peer) => {
		if (!peer) {
			previousAudioMuted = null;
			previousVideoMuted = null;
			return;
		}

		// Check if audio mute state changed
		if (previousAudioMuted !== null && previousAudioMuted !== peer.audioMuted) {
			if (peer.audioMuted) {
				// Peer was muted - stop audio
				console.log("[MuteEnforcement] Audio muted via database, stopping microphone");
				await stopAudioStream();
			}
		}

		// Check if video mute state changed
		if (previousVideoMuted !== null && previousVideoMuted !== peer.videoMuted) {
			if (peer.videoMuted) {
				// Peer was muted - stop video
				console.log("[MuteEnforcement] Video muted via database, stopping camera");
				await stopVideoStream();
			}
		}

		// Update previous states
		previousAudioMuted = peer.audioMuted;
		previousVideoMuted = peer.videoMuted;

		// If currently muted, ensure streams are stopped
		if (peer.audioMuted && getLocalAudioTrack()) {
			console.log("[MuteEnforcement] Audio is muted but stream exists, stopping");
			await stopAudioStream();
		}

		if (peer.videoMuted && getLocalVideoTrack()) {
			console.log("[MuteEnforcement] Video is muted but stream exists, stopping");
			await stopVideoStream();
		}
	});
}
