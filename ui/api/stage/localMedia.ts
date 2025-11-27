/**
 * Local media management for stage streaming
 * Handles getUserMedia, local stream control, and media track management
 */
import { get } from "svelte/store";
import { localMediaStreamStore, camPausedStore, micPausedStore, sendTransportStore, videoProducerStore, audioProducerStore, deviceStore } from "./stores";
import { stageClient, wsPeerIdStore } from "../_trpcClient";
import { currentPeerStore } from "../auth";
import { getMediaConstraints, stopStreamTracks, getVideoTrack, getAudioTrack } from "./utils";
import type { Producer, Transport } from "./types";
import type { CustomAppData, MediaTag } from "~/types/serverSideTypes";

/**
 * Start local video stream from device
 * Handles getUserMedia and manages existing tracks properly
 */
async function _startLocalVideoStreamFromDevice(): Promise<void> {
	console.log("[Stage] Starting local video stream from device");

	// Get any existing stream and tracks
	const existingStream = get(localMediaStreamStore);
	const existingAudioTrack = existingStream ? getAudioTrack(existingStream) : null;
	const existingVideoTrack = existingStream ? getVideoTrack(existingStream) : null;

	// Get user media with both audio and video
	const userMedia = getMediaConstraints(true, true);

	// If we have existing audio track but no video, get video only
	if (existingAudioTrack && !existingVideoTrack) {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: userMedia.video,
		});
		// Add new video track to existing stream
		const newVideoTrack = stream.getVideoTracks()[0];
		if (existingStream && newVideoTrack) {
			existingStream.addTrack(newVideoTrack);
		} else {
			localMediaStreamStore.set(stream);
		}
	}
	// If we have existing video track but no audio, get audio only
	else if (!existingAudioTrack && existingVideoTrack) {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: userMedia.audio,
			video: false,
		});
		// Add new audio track to existing stream
		const newAudioTrack = stream.getAudioTracks()[0];
		if (existingStream && newAudioTrack) {
			existingStream.addTrack(newAudioTrack);
		} else {
			localMediaStreamStore.set(stream);
		}
	}
	// If we have both, keep the existing stream
	else if (existingAudioTrack && existingVideoTrack) {
		// Stream already has both tracks, nothing to do
	}
	// If we have neither, get both
	else {
		const stream = await navigator.mediaDevices.getUserMedia(userMedia);
		localMediaStreamStore.set(stream);
	}

	// Ensure we have the stream set
	const finalStream = get(localMediaStreamStore);
	if (!finalStream) {
		throw new Error("Failed to get user media stream");
	}

	// Initialize pause states based on track availability
	const hasVideo = finalStream.getVideoTracks().length > 0;
	const hasAudio = finalStream.getAudioTracks().length > 0;

	if (!hasVideo) {
		camPausedStore.set(true);
	}
	if (!hasAudio) {
		micPausedStore.set(true);
	}
}

/**
 * Start video capture and begin sending media streams
 */
export async function startVideo(): Promise<void> {
	console.log("[Stage] Starting video");

	// Start local media stream
	await _startLocalVideoStreamFromDevice();

	// If we have a send transport, start sending media
	if (get(sendTransportStore)) {
		await _sendMediaStreams();
	}

	// Update server with media availability
	await stageClient.updateMyMediaAvailability.mutate({ video: true });
}

/**
 * Enable audio capture and streaming
 */
export async function enableAudio(): Promise<void> {
	console.log("[Stage] Enabling audio");

	// Get or create local media stream with audio
	await _startLocalVideoStreamFromDevice();

	const stream = get(localMediaStreamStore);
	if (!stream) return;

	const hasStream = stream !== null;
	const videoTracks = stream.getVideoTracks();
	const audioTracks = stream.getAudioTracks();
	const hasAudioProducer = get(audioProducerStore) !== null;

	// If we don't have audio tracks yet, we need to get them
	if (hasStream && audioTracks.length === 0) {
		await _startLocalVideoStreamFromDevice();
	}

	// If we have audio tracks but no producer, send the streams
	if (hasStream && audioTracks.length > 0 && !hasAudioProducer) {
		await _sendMediaStreams();
	}

	// Update server with media availability
	await stageClient.updateMyMediaAvailability.mutate({ audio: true });
}

/**
 * Disable video streaming
 */
export async function disableVideo(): Promise<void> {
	console.log("[Stage] Disabling video");
	const stream = get(localMediaStreamStore);
	const producer = get(videoProducerStore);

	// Close the video producer if it exists
	if (producer) {
		producer.close();
		videoProducerStore.set(null);
		await stageClient.closeProducer.mutate({ producerId: producer.id });
	}

	// Stop video tracks
	if (stream) {
		const videoTracks = stream.getVideoTracks();
		videoTracks.forEach((track) => track.stop());
	}

	camPausedStore.set(true);
	await stageClient.updateMyMediaAvailability.mutate({ video: false });
}

/**
 * Disable audio streaming
 */
export async function disableAudio(): Promise<void> {
	console.log("[Stage] Disabling audio");
	const stream = get(localMediaStreamStore);
	const producer = get(audioProducerStore);

	// Close the audio producer if it exists
	if (producer) {
		producer.close();
		audioProducerStore.set(null);
		await stageClient.closeProducer.mutate({ producerId: producer.id });
	}

	// Stop audio tracks
	if (stream) {
		const audioTracks = stream.getAudioTracks();
		audioTracks.forEach((track) => track.stop());
	}

	micPausedStore.set(true);
	await stageClient.updateMyMediaAvailability.mutate({ audio: false });
}

/**
 * Send local media streams to the server
 * Creates producers for video and audio tracks
 */
async function _sendMediaStreams(): Promise<void> {
	console.log("[Stage] Sending media streams");

	const stream = get(localMediaStreamStore);
	if (!stream) return;

	let transport = get(sendTransportStore);
	if (!transport) {
		throw new Error("No send transport available");
	}

	const myPeerId = get(wsPeerIdStore);
	const videoTracks = stream.getVideoTracks();
	const audioTracks = stream.getAudioTracks();

	// Produce video if we have a video track and no existing video producer
	if (videoTracks.length > 0 && !get(videoProducerStore)) {
		console.log("[Stage] Producing video track");
		const videoTrack = videoTracks[0];

		const producer = await transport.produce({
			track: videoTrack,
			// Set encoding parameters for better quality
			encodings: [
				{ maxBitrate: 1000000, scaleResolutionDownBy: 1 },
				{ maxBitrate: 500000, scaleResolutionDownBy: 2 },
			],
			appData: { mediaTag: "video" as MediaTag, peerId: myPeerId },
		});

		videoProducerStore.set(producer);
		camPausedStore.set(false);

		// Notify server about the new producer
		await stageClient.produce.mutate({
			transportId: transport.id,
			kind: producer.kind,
			rtpParameters: producer.rtpParameters,
			appData: producer.appData,
		});
	}

	// Produce audio if we have an audio track and no existing audio producer
	if (audioTracks.length > 0 && !get(audioProducerStore)) {
		console.log("[Stage] Producing audio track");
		const audioTrack = audioTracks[0];

		const producer = await transport.produce({
			track: audioTrack,
			appData: { mediaTag: "audio" as MediaTag, peerId: myPeerId },
		});

		audioProducerStore.set(producer);
		micPausedStore.set(false);

		// Notify server about the new producer
		await stageClient.produce.mutate({
			transportId: transport.id,
			kind: producer.kind,
			rtpParameters: producer.rtpParameters,
			appData: producer.appData,
		});
	}
}

/**
 * Toggle video pause state
 * @param paused - Optional explicit pause state, otherwise toggles current state
 */
export async function toggleVideoPaused(paused?: boolean): Promise<void> {
	const currentPaused = get(camPausedStore);
	const newPaused = paused !== undefined ? paused : !currentPaused;

	console.log(`[Stage] Toggling video paused: ${currentPaused} -> ${newPaused}`);
	const producer = get(videoProducerStore);

	if (producer) {
		if (newPaused) {
			await producer.pause();
		} else {
			await producer.resume();
		}
		camPausedStore.set(newPaused);
	}
}

/**
 * Toggle audio pause state
 * @param paused - Optional explicit pause state, otherwise toggles current state
 */
export async function toggleAudioPaused(paused?: boolean): Promise<void> {
	const currentPaused = get(micPausedStore);
	const newPaused = paused !== undefined ? paused : !currentPaused;

	console.log(`[Stage] Toggling audio paused: ${currentPaused} -> ${newPaused}`);
	const producer = get(audioProducerStore);

	if (producer) {
		if (newPaused) {
			await producer.pause();
		} else {
			await producer.resume();
		}
		micPausedStore.set(newPaused);
	}
}

/**
 * Close all local media streams and clean up resources
 */
export async function closeMediaStreams(): Promise<void> {
	console.log("[Stage] Closing media streams");
	const stream = get(localMediaStreamStore);
	const transport = get(sendTransportStore);

	// Stop all tracks in the local stream
	if (stream) {
		stopStreamTracks(stream);
		localMediaStreamStore.set(null);
	}

	// Close the send transport
	if (transport) {
		await stageClient.closeTransport.mutate({ transportId: transport.id });
		transport.close();
		sendTransportStore.set(null);
	}

	// Reset producers
	videoProducerStore.set(null);
	audioProducerStore.set(null);

	// Reset pause states
	camPausedStore.set(false);
	micPausedStore.set(false);
}

// Export for use in mediaRoom module
export { _sendMediaStreams };
