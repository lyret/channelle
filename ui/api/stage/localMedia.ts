/**
 * Local media management for stage streaming
 * Handles getUserMedia, local stream control, and media track management
 */
import { get } from "svelte/store";
import {
	getState,
	setLocalStream,
	setCamPaused,
	setMicPaused,
	setVideoProducer,
	setAudioProducer,
	setSendTransport,
	getLocalVideoTrack,
	getLocalAudioTrack,
} from "./state";
import { stageClient, wsPeerIdStore } from "../_trpcClient";
import { getMediaConstraints, stopStreamTracks } from "./utils";
import type { MediaTag } from "~/types/serverSideTypes";

/**
 * Start local video stream from device
 * Handles getUserMedia and manages existing tracks properly
 */
async function _startLocalVideoStreamFromDevice(): Promise<void> {
	console.log("[Stage] Starting local video stream from device");

	// Get current state
	const state = getState();
	const existingStream = state.localStream;
	const existingAudioTrack = existingStream ? getLocalAudioTrack() : null;
	const existingVideoTrack = existingStream ? getLocalVideoTrack() : null;

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
			setLocalStream(stream);
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
			setLocalStream(stream);
		}
	}
	// If we have both, keep the existing stream
	else if (existingAudioTrack && existingVideoTrack) {
		// Stream already has both tracks, nothing to do
	}
	// If we have neither, get both
	else {
		const stream = await navigator.mediaDevices.getUserMedia(userMedia);
		setLocalStream(stream);
	}

	// Ensure we have the stream set
	const finalStream = getState().localStream;
	if (!finalStream) {
		throw new Error("Failed to get user media stream");
	}

	// Initialize pause states based on track availability
	const hasVideo = finalStream.getVideoTracks().length > 0;
	const hasAudio = finalStream.getAudioTracks().length > 0;

	if (!hasVideo) {
		setCamPaused(true);
	}
	if (!hasAudio) {
		setMicPaused(true);
	}
}

/**
 * Start video capture and begin sending media streams
 */
export async function startVideo(): Promise<void> {
	console.log("[Stage] Starting video");

	// Clean up any existing video producer first
	const existingState = getState();
	if (existingState.videoProducer) {
		console.log("[Stage] Cleaning up existing video producer before starting new one");
		await disableVideo();
		// Small delay to ensure cleanup propagates
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	// Start local media stream
	await _startLocalVideoStreamFromDevice();

	// If we have a send transport, start sending media
	const state = getState();
	if (state.sendTransport) {
		await _sendMediaStreams();
	}

	// Video is now available
}

/**
 * Enable audio capture and streaming
 */
export async function enableAudio(): Promise<void> {
	console.log("[Stage] Enabling audio");

	// Clean up any existing audio producer first
	const existingState = getState();
	if (existingState.audioProducer) {
		console.log("[Stage] Cleaning up existing audio producer before starting new one");
		await disableAudio();
		// Small delay to ensure cleanup propagates
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	// Get or create local media stream with audio
	await _startLocalVideoStreamFromDevice();

	const state = getState();
	const stream = state.localStream;
	if (!stream) return;

	const hasStream = stream !== null;
	const audioTracks = stream.getAudioTracks();
	const hasAudioProducer = state.audioProducer !== null;

	// If we don't have audio tracks yet, we need to get them
	if (hasStream && audioTracks.length === 0) {
		await _startLocalVideoStreamFromDevice();
	}

	// If we have audio tracks but no producer, send the streams
	if (hasStream && audioTracks.length > 0 && !hasAudioProducer) {
		await _sendMediaStreams();
	}

	// Audio is now available
}

/**
 * Disable video streaming
 */
export async function disableVideo(): Promise<void> {
	console.log("[Stage] Disabling video");
	const state = getState();
	const stream = state.localStream;
	const producer = state.videoProducer;

	// Close the video producer if it exists
	if (producer) {
		try {
			// Notify server first to trigger consumer cleanup on remote clients
			await stageClient.closeProducer.mutate({ producerId: producer.id });
		} catch (error) {
			console.error("[Stage] Failed to close producer on server:", error);
		}
		// Then close locally
		producer.close();
		setVideoProducer(null);
	}

	// Stop and remove video tracks from stream
	if (stream) {
		const videoTracks = stream.getVideoTracks();
		videoTracks.forEach((track) => {
			track.stop();
			stream.removeTrack(track);
		});
	}

	setCamPaused(true);
}

/**
 * Disable audio streaming
 */
export async function disableAudio(): Promise<void> {
	console.log("[Stage] Disabling audio");
	const state = getState();
	const stream = state.localStream;
	const producer = state.audioProducer;

	// Close the audio producer if it exists
	if (producer) {
		try {
			// Notify server first to trigger consumer cleanup on remote clients
			await stageClient.closeProducer.mutate({ producerId: producer.id });
		} catch (error) {
			console.error("[Stage] Failed to close producer on server:", error);
		}
		// Then close locally
		producer.close();
		setAudioProducer(null);
	}

	// Stop and remove audio tracks from stream
	if (stream) {
		const audioTracks = stream.getAudioTracks();
		audioTracks.forEach((track) => {
			track.stop();
			stream.removeTrack(track);
		});
	}

	setMicPaused(true);
}

/**
 * Send local media streams to the server
 * Creates producers for video and audio tracks
 */
async function _sendMediaStreams(): Promise<void> {
	console.log("[Stage] Sending media streams");

	const state = getState();
	const stream = state.localStream;
	if (!stream) return;

	let transport = state.sendTransport;

	// Check if transport is still valid
	if (transport && transport.closed) {
		console.log("[Stage] Send transport is closed, clearing it");
		setSendTransport(null);
		transport = null;
	}

	if (!transport) {
		console.log("[Stage] No valid send transport, need to create one");
		// The transport should be created by the room manager
		throw new Error("No send transport available");
	}

	const myPeerId = get(wsPeerIdStore);
	const videoTracks = stream.getVideoTracks();
	const audioTracks = stream.getAudioTracks();

	// Produce video if we have a video track and no existing video producer
	if (videoTracks.length > 0 && !state.videoProducer) {
		console.log("[Stage] Producing video track");
		const videoTrack = videoTracks[0];

		try {
			const producer = await transport.produce({
				track: videoTrack,
				// Set encoding parameters for better quality
				encodings: [
					{ maxBitrate: 1000000, scaleResolutionDownBy: 1 },
					{ maxBitrate: 500000, scaleResolutionDownBy: 2 },
				],
				appData: { mediaTag: "cam-video" as MediaTag, peerId: myPeerId },
			});

			setVideoProducer(producer);
			setCamPaused(false);

			// Handle producer events
			producer.on("transportclose", () => {
				console.log("[Stage] Video producer transport closed");
				setVideoProducer(null);
			});

			producer.on("trackended", () => {
				console.log("[Stage] Video producer track ended");
				disableVideo().catch(console.error);
			});

			// Notify server about the new producer
			await stageClient.sendTrack.mutate({
				transportId: transport.id,
				kind: producer.kind,
				rtpParameters: producer.rtpParameters,
				appData: producer.appData,
				paused: false,
			});
		} catch (error) {
			console.error("[Stage] Failed to produce video:", error);
			throw error;
		}
	}

	// Produce audio if we have an audio track and no existing audio producer
	if (audioTracks.length > 0 && !state.audioProducer) {
		console.log("[Stage] Producing audio track");
		const audioTrack = audioTracks[0];

		try {
			const producer = await transport.produce({
				track: audioTrack,
				appData: { mediaTag: "mic-audio" as MediaTag, peerId: myPeerId },
			});

			setAudioProducer(producer);
			setMicPaused(false);

			// Handle producer events
			producer.on("transportclose", () => {
				console.log("[Stage] Audio producer transport closed");
				setAudioProducer(null);
			});

			producer.on("trackended", () => {
				console.log("[Stage] Audio producer track ended");
				disableAudio().catch(console.error);
			});

			// Notify server about the new producer
			await stageClient.sendTrack.mutate({
				transportId: transport.id,
				kind: producer.kind,
				rtpParameters: producer.rtpParameters,
				appData: producer.appData,
				paused: false,
			});
		} catch (error) {
			console.error("[Stage] Failed to produce audio:", error);
			throw error;
		}
	}
}

/**
 * Toggle video pause state
 * @param paused - Optional explicit pause state, otherwise toggles current state
 */
export async function toggleVideoPaused(paused?: boolean): Promise<void> {
	const state = getState();
	const currentPaused = state.camPaused;
	const newPaused = paused !== undefined ? paused : !currentPaused;

	console.log(`[Stage] Toggling video paused: ${currentPaused} -> ${newPaused}`);
	const producer = state.videoProducer;

	if (producer) {
		if (newPaused) {
			await producer.pause();
		} else {
			await producer.resume();
		}
		setCamPaused(newPaused);
	}
}

/**
 * Toggle audio pause state
 * @param paused - Optional explicit pause state, otherwise toggles current state
 */
export async function toggleAudioPaused(paused?: boolean): Promise<void> {
	const state = getState();
	const currentPaused = state.micPaused;
	const newPaused = paused !== undefined ? paused : !currentPaused;

	console.log(`[Stage] Toggling audio paused: ${currentPaused} -> ${newPaused}`);
	const producer = state.audioProducer;

	if (producer) {
		if (newPaused) {
			await producer.pause();
		} else {
			await producer.resume();
		}
		setMicPaused(newPaused);
	}
}

/**
 * Close all local media streams and clean up resources
 */
export async function closeMediaStreams(): Promise<void> {
	console.log("[Stage] Closing media streams");
	const state = getState();
	const stream = state.localStream;
	const transport = state.sendTransport;

	// Stop all tracks in the local stream
	if (stream) {
		stopStreamTracks(stream);
		setLocalStream(null);
	}

	// Close the send transport
	if (transport) {
		await stageClient.closeTransport.mutate({ transportId: transport.id });
		transport.close();
		setSendTransport(null);
	}

	// Reset producers
	setVideoProducer(null);
	setAudioProducer(null);

	// Reset pause states
	setCamPaused(false);
	setMicPaused(false);
}

// Export for use in mediaRoom module
export { _sendMediaStreams };
