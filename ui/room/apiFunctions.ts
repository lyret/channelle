import * as MediaSoup from "mediasoup-client";
import DeepEqual from "deep-equal";
import { writable, derived } from "svelte/store";
import { roomClient } from "./roomClient";
import type { CustomAppData, MediaTag, Transport, Producer, Consumer, TransportDirection, Peer } from "./types";

// Svelte stores for reactive state
export const deviceStore = writable<MediaSoup.types.Device | null>(null);
export const joinedStore = writable(false);
export const paused = writable(false);
export const localMediaStream = writable<MediaStream | null>(null);
export const recvTransportStore = writable<Transport | null>(null);
export const sendTransport = writable<Transport | null>(null);
export const videoProducer = writable<Producer | null>(null);
export const audioProducer = writable<Producer | null>(null);
export const currentActiveSpeakerStore = writable<{ peerId?: string | null }>({});
export const consumersStore = writable<Consumer[]>([]);
export const myPeerIdStore = writable<string>("");
export const peersStore = writable<Record<string, any>>({});

// Internal variables (not reactive) - also exported for console debugging
export let _localMediaStream: MediaStream;
export let _recvTransport: Transport;
export let _sendTransport: Transport;
export let _videoProducer: Producer;
export let _audioProducer: Producer;
export let _peerId: string = "";
export let _consumers: Consumer[] = [];
export let pollingInterval: ReturnType<typeof setInterval>;

// Derived stores for convenience
export const hasLocalCamStore = derived(localMediaStream, ($localCam) => !!$localCam);
export const hasSendTransportStore = derived(sendTransport, ($transport) => !!$transport);
export const hasRecvTransportStore = derived(recvTransportStore, ($transport) => !!$transport);

/** Room joined status */
let _joined: boolean;

/** Camera paused status */
let _camPaused = false;

/** Microphone paused status */
let _micPaused = false;

/** Interval timer for polling the backend server */
let _pollingInterval: ReturnType<typeof setInterval> | undefined;

/** Keep a reference to the previous synced peers for comparisons */
let _previousSyncedPeers: Record<string, any> = {};

/** Keep track of client code rebuilds during development */
let _localBuildCounter = -1;

/** MediaSoup device */
export let _device: MediaSoup.types.Device;

/** Join the room */
export async function joinRoom() {
	// Signal that we're a new peer and initialize our
	// mediasoup-client device, if this is our first time connecting
	const { peerId, routerRtpCapabilities } = await roomClient.join.mutate();
	myPeerIdStore.set(peerId);
	joinedStore.set(true);
	console.log("[Room] Joined, my peerId is", peerId);
	_peerId = peerId;

	// Initialize the MediaSoup device
	try {
		if (!_device) {
			_device = new MediaSoup.Device();
			await _device.load({ routerRtpCapabilities });
		}
	} catch (err: any) {
		if (err.name === "UnsupportedError") {
			console.error("[MEDIA DEVICE] The browser not supported for video calls");
			throw err;
		} else {
			console.error("[MEDIA DEVICE] The media device could not be initialized");
			throw err;
		}
	}

	// Let's poll at 1-second intervals when joined
	_pollingInterval = setInterval(async () => {
		try {
			await syncRoom();
		} catch (err) {
			console.error("[Room] Poll stopped:", err);
			clearInterval(_pollingInterval);
		}
	}, 1000);

	// Update the joined status
	_joined = true;
}

/** Leave the room */
export async function leaveRoom() {
	console.log("[Room] leaving the room");

	// Stop polling
	if (_pollingInterval) {
		clearInterval(_pollingInterval);
		_pollingInterval = undefined;
	}

	// Close everything on the server-side (transports, producers, consumers)
	await roomClient.leave.mutate();
	// Closing the transports closes all producers and consumers. we
	// don't need to do anything beyond closing the transports, except
	// to set all our local variables to their initial states
	_recvTransport?.close();
	_sendTransport?.close();

	_previousSyncedPeers = {};
	// TODO: Make sure everything is closed
	recvTransportStore.set(null);
	sendTransport.set(null);
	videoProducer.set(null);
	audioProducer.set(null);
	localMediaStream.set(null);
	consumersStore.set([]);
	joinedStore.set(false);
	myPeerIdStore.set("");

	// Reset the room status
	_joined = false;
}

/** State polling and update logic */
async function syncRoom() {
	const { peers, activeSpeaker, buildCounter } = await roomClient.sync.query();
	console.debug({ peers });

	// Reload the window if the build counter has changed during development
	if (buildCounter > _localBuildCounter && _localBuildCounter != -1) {
		window.location.reload();
	} else {
		_localBuildCounter = buildCounter;
	}

	// Update the active speaker
	currentActiveSpeakerStore.set(activeSpeaker);

	// Decide if we need to update tracks list
	// build list of peers, sorted by join time, removing last
	// seen time and stats, so we can easily do a deep-equals
	// comparison. compare this list with the cached list from last poll.
	const thisPeersList = _sortPeers(peers);
	const lastPeersList = _sortPeers(_previousSyncedPeers);

	if (!DeepEqual(thisPeersList, lastPeersList)) {
		// TODO: Remove?
		// Update happens in UI, which we've removed
	}

	// If a peer has gone away, we need to close all consumers we have
	// for that peer
	for (const id in _previousSyncedPeers) {
		if (!peers[id]) {
			console.log(`[Room] Peer ${id} has left`);
			_consumers.forEach((consumer) => {
				if (consumer.appData.peerId === id) {
					closeConsumer(consumer);
				}
			});
		}
	}

	// If a peer has stopped sending media that we are consuming, we
	// need to close the consumer
	_consumers.forEach((consumer) => {
		const { peerId, mediaTag } = consumer.appData;

		// Type guard to ensure peers[peerId] is an object
		if (!peers[peerId] || typeof peers[peerId] !== "object") {
			console.log(`[Room] Peer ${peerId} has left or is invalid`);
			closeConsumer(consumer);
			return;
		}

		// Access media safely
		const peer = peers[peerId];
		if (!peer.media || typeof peer.media !== "object") {
			console.log(`[Room] Peer ${peerId} has no media`);
			closeConsumer(consumer);
			return;
		}

		// Check if the specific mediaTag exists
		if (!Object.prototype.hasOwnProperty.call(peer.media, mediaTag)) {
			console.log(`[Room] Peer ${peerId} has stopped transmitting ${mediaTag}`);
			closeConsumer(consumer);
			return;
		}
	});

	// Update the peers store with full peer information
	peersStore.set(peers);

	// Update the last poll sync data
	_previousSyncedPeers = peers;
}

/** Access the local media streams from the browser */
export async function startLocalMediaStream(audio: boolean = true, video: boolean = true) {
	console.log(`[Media] Accessing the local media stream (audio: ${audio ? 1 : 0}, video: ${video ? 1 : 0})`);
	_localMediaStream = await navigator.mediaDevices.getUserMedia({
		video: video,
		audio: audio,
	});
	localMediaStream.set(_localMediaStream);
}

/** Start transporting activated local streams to the server */
export async function sendMediaStreams() {
	console.log("[Room] Sending streams");

	// Make sure we're joined and have a local media stream
	if (!_joined) {
		throw new Error("Not joined");
	}
	if (!_localMediaStream) {
		throw new Error("Local media stream not available");
	}

	// Create a transport for outgoing media, if we don't already have one
	if (!_sendTransport) {
		_sendTransport = await _createTransport("send");
		sendTransport.set(_sendTransport);
	}

	// Start sending video if we have a local video stream
	// the transport logic will initiate a
	// signaling conversation with the server to set up an outbound rtp
	// stream for the camera video track.
	if (_localMediaStream.getVideoTracks().length > 0) {
		_videoProducer = await _sendTransport.produce({
			track: _localMediaStream.getVideoTracks()[0],
			// Just two resolutions, for now, as chrome 75 seems to ignore more
			// than two encodings
			encodings: [
				{ maxBitrate: 96000, scaleResolutionDownBy: 4 },
				{ maxBitrate: 680000, scaleResolutionDownBy: 1 },
			],
			appData: { mediaTag: "cam-video", peerId: _peerId },
		});
		videoProducer.set(_videoProducer);

		if (_camPaused) {
			_videoProducer.pause();
		}
	}

	// Start sending audio if we have a local audio stream
	if (_localMediaStream.getAudioTracks().length > 0) {
		_audioProducer = await _sendTransport.produce({
			track: _localMediaStream.getAudioTracks()[0],
			appData: { mediaTag: "mic-audio", peerId: _peerId },
		});
		audioProducer.set(_audioProducer);

		if (_micPaused) {
			try {
				_audioProducer.pause();
			} catch (e: any) {
				console.error(e);
			}
		}
	}
}

/** Set the paused status of the video producer */
export async function toggleVideoPaused(paused?: boolean) {
	_camPaused = paused !== undefined ? paused : !_camPaused;
	if (_camPaused && _videoProducer) {
		await pauseProducer(_videoProducer);
	} else {
		await resumeProducer(_videoProducer);
	}
}

/** Set the paused status of the audio producer */
export async function toggleAudioPaused(paused?: boolean) {
	_micPaused = paused !== undefined ? paused : !_micPaused;
	if (_micPaused && _audioProducer) {
		await pauseProducer(_audioProducer);
	} else {
		await resumeProducer(_audioProducer);
	}
}

/** Stop transporting all media to the server */
export async function closeMediaStreams() {
	if (!_localMediaStream) {
		return;
	}
	if (!_sendTransport) {
		return;
	}
	console.log("[MS] Stopping sending of media streams");
	await roomClient.closeTransport.mutate({ transportId: _sendTransport.id });

	// Closing the sendTransport closes all associated producers. when
	// the Video Producer and Audio Producer are closed,
	// mediasoup-client stops the local camera tracks, so we don't need to
	// do anything except set all our local variables to null.
	_sendTransport.close();

	// TODO: Make sure this is correct
	_sendTransport = null!;
	sendTransport.set(null);
	_videoProducer = null!;
	videoProducer.set(null);
	_audioProducer = null!;
	audioProducer.set(null);
	_localMediaStream = null!;
	localMediaStream.set(null);
}

/** Creates a consumer for a remote track from the given peer and for the given media tag */
export async function subscribeToTrack(peerId: string, mediaTag: MediaTag) {
	// Create a receiver transport if we don't already have one
	if (!_recvTransport) {
		_recvTransport = await _createTransport("recv");
		recvTransportStore.set(_recvTransport);
	}

	// If we do already have a consumer, we shouldn't have called this
	// method
	const existingConsumer = _findConsumerForTrack(peerId, mediaTag);
	if (existingConsumer) {
		console.warn("[MS] There is already a consumer for this track", peerId, mediaTag);
		return;
	}

	console.log(`[Room] Subscribing to ${mediaTag} track from ${peerId}`);

	// Ask the server to create a server-side consumer object and send
	// us back the info we need to create a client-side consumer
	const consumerParameters = await roomClient.recvTrack.mutate({
		mediaTag,
		mediaPeerId: peerId,
		rtpCapabilities: _device.rtpCapabilities,
	});

	console.log("[MS] Got consumer parameters:", consumerParameters);

	const consumer = await _recvTransport.consume({
		...consumerParameters,
		appData: { peerId, mediaTag },
	});

	console.log("[MS] Created new consumer:", consumer.id);

	// The server-side consumer will be started in paused state. wait
	// until we're connected, then send a resume request to the server
	// to get our first keyframe and start displaying video
	while (_recvTransport.connectionState !== "connected") {
		console.log("[MS] transport connection state is ", _recvTransport.connectionState);
		await _sleep(100);
	}

	// Okay, we're ready. let's ask the peer to send us media
	await resumeConsumer(consumer);

	// Keep track of all our consumers
	_consumers.push(consumer);
}

/** Removes the consumer for a remote track from the given peer and for the given media tag */
export async function unsubscribeFromTrack(peerId: string, mediaTag: MediaTag) {
	const consumer = _findConsumerForTrack(peerId, mediaTag);
	if (!consumer) {
		console.warn("[MS] No consumer exists for this track", peerId, mediaTag);
		return;
	}
	console.log("[MS] unsubscribing from track", peerId, mediaTag);
	await closeConsumer(consumer);
}

/** Returns a statistics object for remote peers and local consumers */
export function getTrackStats() {
	const total = _consumers.length;
	const paused = _consumers.filter((c) => c.paused).length;
	const active = total - paused;
	const video = _consumers.filter((c) => c.appData.mediaTag?.includes("video")).length;
	const audio = _consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length;

	return {
		total,
		active,
		paused,
		video,
		audio,
	};
}

/** Pauses the given consumer */
export async function pauseConsumer(consumer: Consumer) {
	console.log("[MS] Pausing consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);
	await roomClient.pauseConsumer.mutate({ consumerId: consumer.id });
	consumer.pause();
}

/** Resumes the given paused consumer */
export async function resumeConsumer(consumer: Consumer) {
	console.log("[MS] Resuming the consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);
	await roomClient.resumeConsumer.mutate({ consumerId: consumer.id });
	consumer.resume();
}

/** Closes and remove the given consumer */
export async function closeConsumer(consumer: Consumer) {
	console.log("[MS] Closing the consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);

	// Tell the server we're closing this consumer. (the server-side
	// consumer may have been closed already, but that's okay.)
	await roomClient.closeConsumer.mutate({ consumerId: consumer.id });
	consumer.close();

	_consumers = _consumers.filter(({ id }) => id !== consumer.id);
	consumersStore.set([..._consumers]);
}

/** Pauses all active consumers */
export async function pauseAllConsumers() {
	for (const consumer of _consumers) {
		if (!consumer.paused) {
			await pauseConsumer(consumer);
		}
	}
}

/** Resumes all paused consumers */
export async function resumeAllConsumers() {
	for (const consumer of _consumers) {
		if (consumer.paused) {
			await resumeConsumer(consumer);
		}
	}
}

/** Closes all consumers */
export async function closeAllConsumers() {
	const consumersToClose = [..._consumers];
	for (const consumer of consumersToClose) {
		await closeConsumer(consumer);
	}
}

/** Pauses the given producer */
export async function pauseProducer(producer: Producer) {
	if (!producer.paused) {
		console.log("[MS] Pausing producer for", producer.appData.mediaTag);
		await roomClient.pauseProducer.mutate({ producerId: producer.id });
		producer.pause();
	}
}

/** Resumes the given producer if paused */
export async function resumeProducer(producer: Producer) {
	if (producer.paused) {
		try {
			console.log("[MS]Resuming producer for", producer.appData.mediaTag);
			await roomClient.resumeProducer.mutate({ producerId: producer.id });
			producer.resume();
		} catch (e) {
			console.error(e);
		}
	}
}

/** Utility function to create a transport and hook up signaling logic appropriate to the transport's direction */
async function _createTransport(direction: TransportDirection): Promise<Transport> {
	console.log(`[MS] Creating ${direction}-transport`);

	// Ask the server to create a server-side transport object and send
	// us back the info we need to create a client-side transport
	let transport: MediaSoup.types.Transport<CustomAppData>;
	const { transportOptions } = await roomClient.createTransport.mutate({ direction });

	if (direction === "recv") {
		transport = _device.createRecvTransport(transportOptions);
	} else if (direction === "send") {
		transport = _device.createSendTransport(transportOptions);
	} else {
		throw new Error(`Bad transport direction: ${direction}`);
	}

	// Connect
	// mediasoup-client will emit a connect event when media needs to
	// start flowing for the first time. send dtlsParameters to the
	// server, then call resolve() on success or reject() on failure.
	transport.on("connect", (params, resolve, reject) => {
		const dtlsParameters = params.dtlsParameters;
		console.log("[MS] transport connect event", direction);

		roomClient.connectTransport
			.mutate({
				transportId: transportOptions.id,
				dtlsParameters,
			})
			.then(resolve)
			.catch((err) => {
				console.error("[MS] Error connecting transport", direction, err);
				reject(err);
			});
	});

	// Produce
	// sending transports will emit a produce event when a new track
	// needs to be set up to start sending. the producer's appData is
	// passed as a parameter
	if (direction === "send") {
		transport.on("produce", (params, resolve, reject) => {
			const { kind, rtpParameters } = params;
			const appData = params.appData as CustomAppData;
			console.log("[MS] transport produce event", appData);

			// Respect the current paused status
			let paused = true;
			if (appData.mediaTag === "cam-video") {
				paused = _camPaused;
			} else if (appData.mediaTag === "mic-audio") {
				paused = _micPaused;
			}

			// Tell the server what it needs to know from us in order to set
			// up a server-side producer object, and get back a
			// producer.id.
			roomClient.sendTrack
				.mutate({
					transportId: transportOptions.id,
					kind,
					rtpParameters,
					paused,
					appData,
				})
				.then((response) => {
					const producerId = response.id;
					resolve({ id: producerId });
				})
				.catch((err) => {
					console.error("[MS] Error setting up server-side producer", err);
					reject(err);
				});
		});
	}

	// Connection state changes
	// for this simple demo, any time a transport transitions to closed,
	// failed, or disconnected, leave the room and reset
	// TODO: Is this ok?
	transport.on("connectionstatechange", async (state: string) => {
		console.log(`[MS] Transport ${transport.id} connection state changed to ${state}`);

		if (state === "closed" || state === "failed" || state === "disconnected") {
			console.log("[MS] Transport closed... leaving the room and resetting");
			leaveRoom();
		}
	});

	// Return the transport
	return transport;
}

/** Utility function for finding a consumer matching the given peerId and mediaTag */
function _findConsumerForTrack(peerId: string, mediaTag: MediaTag): Consumer | undefined {
	return _consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

/** Utility function for sorting peers by join time */
function _sortPeers(peers: Record<string, Peer>): Array<Peer> {
	return Object.values(peers).sort((a, b) => (a.joinTs > b.joinTs ? 1 : b.joinTs > a.joinTs ? -1 : 0));
}

/** Utility function to sleep for a given number of milliseconds */
async function _sleep(ms: number) {
	return new Promise<void>((r) => setTimeout(() => r(), ms));
}

// // switch to sending video from the "next" camera device in our device
// // list (if we have multiple cameras)
// export async function cycleCamera() {
// 	if (!(_videoProducer && _videoProducer.track)) {
// 		console.warn("cannot cycle camera - no current camera track");
// 		return;
// 	}

// 	console.log("cycle camera");

// 	// find "next" device in device list
// 	const deviceId = await getCurrentDeviceId();
// 	const allDevices = await navigator.mediaDevices.enumerateDevices();
// 	const vidDevices = allDevices.filter((d) => d.kind === "videoinput");
// 	if (!(vidDevices.length > 1)) {
// 		console.warn("cannot cycle camera - only one camera");
// 		return;
// 	}
// 	let idx = vidDevices.findIndex((d) => d.deviceId === deviceId);
// 	if (idx === vidDevices.length - 1) {
// 		idx = 0;
// 	} else {
// 		idx += 1;
// 	}

// 	// get a new video stream. might as well get a new audio stream too,
// 	// just in case browsers want to group audio/video streams together
// 	// from the same device when possible (though they don't seem to,
// 	// currently)
// 	console.log("getting a video stream from new device", vidDevices[idx].label);
// 	_localMediaStream = await navigator.mediaDevices.getUserMedia({
// 		video: { deviceId: { exact: vidDevices[idx].deviceId } },
// 		audio: true,
// 	});
// 	localMediaStream.set(_localMediaStream);

// 	// replace the tracks we are sending
// 	await _videoProducer.replaceTrack({ track: _localMediaStream.getVideoTracks()[0] });
// 	await _audioProducer.replaceTrack({ track: _localMediaStream.getAudioTracks()[0] });
// }
// export async function getCurrentDeviceId() {
// 	if (!_videoProducer || !_videoProducer.track) {
// 		return null;
// 	}
// 	const deviceId = _videoProducer.track.getSettings().deviceId;
// 	if (deviceId) {
// 		return deviceId;
// 	}
// 	// Firefox doesn't have deviceId in MediaTrackSettings object
// 	const track = _localMediaStream && _localMediaStream.getVideoTracks()[0];
// 	if (!track) {
// 		return null;
// 	}
// 	const devices = await navigator.mediaDevices.enumerateDevices();
// 	const deviceInfo = devices.find((d) => d.label.startsWith(track.label));
// 	return deviceInfo ? deviceInfo.deviceId : null;
// }
