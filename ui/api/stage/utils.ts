/**
 * Utility functions for stage media streaming
 */
import { get } from "svelte/store";
import type { Consumer, MediaTag } from "./types";
import { consumersStore, recvTransports, sendTransportStore, videoProducerStore, audioProducerStore, localMediaStreamStore } from "./stores";
import { stageClient } from "../_trpcClient";

/**
 * Find a consumer matching the given peer and media tag
 * @param peerId - Peer ID to search for
 * @param mediaTag - Media tag to search for
 * @returns Matching consumer or undefined
 */
export function findConsumerForTrack(peerId: string, mediaTag: MediaTag): Consumer | undefined {
	const consumers = get(consumersStore);
	return consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

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

	// Closing the transports closes all producers and consumers. we
	// don't need to do anything beyond closing the transports, except
	// to set all our local variables to their initial states
	const currentRecvTransports = get(recvTransports);
	const currentSendTransport = get(sendTransportStore);

	// Close all receive transports
	Object.values(currentRecvTransports).forEach((transport) => transport.close());
	currentSendTransport?.close();

	// Reset all stores
	recvTransports.set({});
	sendTransportStore.set(null);
	videoProducerStore.set(null);
	audioProducerStore.set(null);
	localMediaStreamStore.set(null);
	consumersStore.set([]);
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
 * Get the first video track from a media stream
 * @param stream - MediaStream to get track from
 * @returns MediaStreamTrack or null
 */
export function getVideoTrack(stream: MediaStream): MediaStreamTrack | null {
	const tracks = stream.getVideoTracks();
	return tracks.length > 0 ? tracks[0] : null;
}

/**
 * Get the first audio track from a media stream
 * @param stream - MediaStream to get track from
 * @returns MediaStreamTrack or null
 */
export function getAudioTrack(stream: MediaStream): MediaStreamTrack | null {
	const tracks = stream.getAudioTracks();
	return tracks.length > 0 ? tracks[0] : null;
}

/**
 * Check if a consumer is active (not paused and not closed)
 * @param consumer - Consumer to check
 * @returns boolean indicating if consumer is active
 */
export function isConsumerActive(consumer: Consumer): boolean {
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
