/**
 * Utility functions for stage media streaming
 */
import { getState, cleanupMediaState } from "./state";
import { stageClient } from "../_trpcClient";

/**
 * Sleep utility for async delays
 * @param ms - Milliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise<void>((r) => setTimeout(() => r(), ms));
}

/**
 * Utility function for leaving the media room and cleaning up all WebRTC resources
 */
export async function endMediaParticipation(): Promise<void> {
	console.log("[Stage] Ending media participation");

	// Close everything on the server-side (transports, producers, consumers)
	await stageClient.endSession.mutate();

	// Clean up all local state and resources
	cleanupMediaState();
}

/**
 * Check if a media stream has both video and audio tracks
 * @param stream - MediaStream to check
 * @returns Object with hasVideo and hasAudio boolean flags
 */
export function checkStreamTracks(stream: MediaStream): { hasVideo: boolean; hasAudio: boolean } {
	return {
		hasVideo: stream.getVideoTracks().length > 0,
		hasAudio: stream.getAudioTracks().length > 0,
	};
}

/**
 * Stop all tracks in a media stream
 * @param stream - MediaStream to stop
 */
export function stopStreamTracks(stream: MediaStream): void {
	stream.getTracks().forEach((track) => track.stop());
}

/**
 * Check if a consumer is active (not paused and not closed)
 * @param consumer - Consumer to check
 * @returns boolean indicating if consumer is active
 */
export function isConsumerActive(consumer: any): boolean {
	return !consumer.paused && !consumer.closed;
}

/**
 * Get media constraints for getUserMedia
 * @param video - Enable video (default true)
 * @param audio - Enable audio (default true)
 * @returns MediaStreamConstraints object
 */
export function getMediaConstraints(video = true, audio = true): MediaStreamConstraints {
	return {
		video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
		audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
	};
}
