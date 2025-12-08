/**
 * Media enforcement functionality
 * Monitors peer state changes and enforces stream stopping when media should be disabled
 * Handles both database mute states and permission changes from scene settings
 */

import { localPeerMediaState } from "./peerMediaStores";
import { disableCamera, disableMicrophone } from "~/api/stageNew";
import { getLocalVideoTrack, getLocalAudioTrack } from "~/api/stage";

// Track enforcement state
let mediaEnforcementUnsubscribe: (() => void) | null = null;
let previousAudioMuted: boolean | null = null;
let previousVideoMuted: boolean | null = null;
let previousAudioAllowed: boolean | null = null;
let previousVideoAllowed: boolean | null = null;

/**
 * Stop audio stream with reason logging
 */
async function stopAudioStream(reason: string): Promise<void> {
	try {
		// Stop microphone
		await disableMicrophone();

		// Ensure local track is stopped
		const audioTrack = getLocalAudioTrack();
		if (audioTrack) {
			audioTrack.stop();
			console.log(`[MediaEnforcement] Audio track stopped - ${reason}`);
		}
	} catch (error) {
		console.error(`[MediaEnforcement] Failed to stop audio stream (${reason}):`, error);
	}
}

/**
 * Stop video stream with reason logging
 */
async function stopVideoStream(reason: string): Promise<void> {
	try {
		// Stop camera
		await disableCamera();

		// Ensure local track is stopped
		const videoTrack = getLocalVideoTrack();
		if (videoTrack) {
			videoTrack.stop();
			console.log(`[MediaEnforcement] Video track stopped - ${reason}`);
		}
	} catch (error) {
		console.error(`[MediaEnforcement] Failed to stop video stream (${reason}):`, error);
	}
}

/**
 * Start comprehensive media enforcement monitoring
 * Handles both database mute states and permission changes from scene settings
 */
export function startMuteEnforcement(): void {
	// Stop any existing enforcement
	if (mediaEnforcementUnsubscribe) {
		mediaEnforcementUnsubscribe();
	}

	// Subscribe to comprehensive media state changes
	mediaEnforcementUnsubscribe = localPeerMediaState.subscribe(async (mediaState) => {
		if (!mediaState) {
			// Reset all previous states
			previousAudioMuted = null;
			previousVideoMuted = null;
			previousAudioAllowed = null;
			previousVideoAllowed = null;
			return;
		}

		// Check if audio was muted via database
		if (previousAudioMuted !== null && previousAudioMuted !== mediaState.audioMuted) {
			if (mediaState.audioMuted) {
				console.log("[MediaEnforcement] Audio muted via database, stopping microphone");
				await stopAudioStream("muted via database");
			}
		}

		// Check if video was muted via database
		if (previousVideoMuted !== null && previousVideoMuted !== mediaState.videoMuted) {
			if (mediaState.videoMuted) {
				console.log("[MediaEnforcement] Video muted via database, stopping camera");
				await stopVideoStream("muted via database");
			}
		}

		// Check if audio permissions were revoked
		if (previousAudioAllowed !== null && previousAudioAllowed === true && mediaState.audioAllowed === false) {
			console.log("[MediaEnforcement] Audio permissions revoked, stopping microphone");
			await stopAudioStream("permissions revoked");
		}

		// Check if video permissions were revoked
		if (previousVideoAllowed !== null && previousVideoAllowed === true && mediaState.videoAllowed === false) {
			console.log("[MediaEnforcement] Video permissions revoked, stopping camera");
			await stopVideoStream("permissions revoked");
		}

		// Update previous states
		previousAudioMuted = mediaState.audioMuted;
		previousVideoMuted = mediaState.videoMuted;
		previousAudioAllowed = mediaState.audioAllowed;
		previousVideoAllowed = mediaState.videoAllowed;

		// Enforce current restrictions - stop streams that shouldn't be running
		if ((mediaState.audioMuted || !mediaState.audioAllowed) && getLocalAudioTrack()) {
			const reason = mediaState.audioMuted ? "currently muted" : "permissions not allowed";
			console.log(`[MediaEnforcement] Audio is ${reason} but stream exists, stopping`);
			await stopAudioStream(reason);
		}

		if ((mediaState.videoMuted || !mediaState.videoAllowed) && getLocalVideoTrack()) {
			const reason = mediaState.videoMuted ? "currently muted" : "permissions not allowed";
			console.log(`[MediaEnforcement] Video is ${reason} but stream exists, stopping`);
			await stopVideoStream(reason);
		}
	});
}

/**
 * Stop media enforcement
 */
export function stopMuteEnforcement(): void {
	if (mediaEnforcementUnsubscribe) {
		mediaEnforcementUnsubscribe();
		mediaEnforcementUnsubscribe = null;
	}
	previousAudioMuted = null;
	previousVideoMuted = null;
	previousAudioAllowed = null;
	previousVideoAllowed = null;
}
