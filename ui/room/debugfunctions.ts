import DeepEqual from "deep-equal";
import * as MediaSoup from "mediasoup-client";
import { roomClient } from "./room-client";

// Export all the references we use internally to manage call state,
// to make it easy to tinker from the js console. for example:
//
//   `Client.camVideoProducer.paused`
//
export let device: MediaSoup.types.Device;
export let joined: boolean;
export let localCam: MediaStream;
export let localScreen: MediaStream;
export let recvTransport: MediaSoup.types.Transport;
export let sendTransport: MediaSoup.types.Transport;
export let camVideoProducer: MediaSoup.types.Producer;
export let camAudioProducer: MediaSoup.types.Producer;
export let screenVideoProducer: MediaSoup.types.Producer;
export let screenAudioProducer: MediaSoup.types.Producer;
export let currentActiveSpeaker: { peerId?: string | null } = {};
export let lastPollSyncData: Record<string, any> = {};
export let consumers: MediaSoup.types.Consumer[] = [];
export let pollingInterval: ReturnType<typeof setInterval>;

export async function onPageLoad() {
	try {
		device = new MediaSoup.Device();
		// join the room
		await joinRoom();

		// super-simple signaling: let's poll at 1-second intervals
		pollingInterval = setInterval(async () => {
			try {
				await pollAndUpdate();
			} catch (err) {
				console.error("Poll stopped:", err);
				clearInterval(pollingInterval);
			}
		}, 1000);
	} catch (e: any) {
		if (e.name === "UnsupportedError") {
			console.error("browser not supported for video calls");
			return;
		} else {
			console.error(e);
		}
	}

	// use sendBeacon to tell the server we're disconnecting when
	// the page unloads
	window.addEventListener("unload", () => roomClient.leave.mutate());
}

//
// meeting control actions
//
export async function joinRoom() {
	if (joined) {
		return;
	}

	console.log("[Room] joined");

	try {
		// signal that we're a new peer and initialize our
		// mediasoup-client device, if this is our first time connecting
		const { peerId, routerRtpCapabilities } = await roomClient.join.mutate();
		console.log("[Room] my peerId is", peerId);
		if (!device.loaded) {
			await device.load({ routerRtpCapabilities });
		}
		joined = true;
	} catch (e: any) {
		console.error(e);
		return;
	}
}

export async function sendCameraStreams() {
	console.log("send camera streams");

	// make sure we've joined the room and started our camera. these
	// functions don't do anything if they've already been called this
	// session
	await joinRoom();
	await startCamera();

	// create a transport for outgoing media, if we don't already have one
	if (!sendTransport) {
		sendTransport = await createTransport("send");
	}

	// start sending video. the transport logic will initiate a
	// signaling conversation with the server to set up an outbound rtp
	// stream for the camera video track.
	camVideoProducer = await sendTransport.produce({
		track: localCam.getVideoTracks()[0],
		encodings: camEncodings(),
		appData: { mediaTag: "cam-video" },
	});

	if (getCamPausedState()) {
		try {
			camVideoProducer.pause();
		} catch (e: any) {
			console.error(e);
		}
	}

	// same thing for audio
	camAudioProducer = await sendTransport.produce({
		track: localCam.getAudioTracks()[0],
		appData: { mediaTag: "cam-audio" },
	});

	if (getMicPausedState()) {
		try {
			camAudioProducer.pause();
		} catch (e: any) {
			console.error(e);
		}
	}
}

export async function startScreenshare() {
	console.log("start screen share");

	// make sure we've joined the room and that we have a sending
	// transport
	await joinRoom();
	if (!sendTransport) {
		sendTransport = await createTransport("send");
	}

	// get a screen share track
	localScreen = await navigator.mediaDevices.getDisplayMedia({
		video: true,
		audio: true,
	});

	// create a producer for video
	screenVideoProducer = await sendTransport.produce({
		track: localScreen.getVideoTracks()[0],
		encodings: screenshareEncodings(),
		appData: { mediaTag: "screen-video" },
	});

	// create a producer for audio, if we have it
	if (localScreen.getAudioTracks().length) {
		screenAudioProducer = await sendTransport.produce({
			track: localScreen.getAudioTracks()[0],
			appData: { mediaTag: "screen-audio" },
		});
	}

	// handler for screen share stopped event (triggered by the
	// browser's built-in screen sharing ui)
	if (screenVideoProducer.track) {
		screenVideoProducer.track.onended = async () => {
			console.log("screen share stopped");
			try {
				screenVideoProducer.pause();
				await roomClient.closeProducer.mutate({ producerId: screenVideoProducer.id });
				screenVideoProducer.close();
				screenVideoProducer = null as unknown as MediaSoup.types.Producer;
				if (screenAudioProducer) {
					await roomClient.closeProducer.mutate({ producerId: screenAudioProducer.id });
					screenAudioProducer.close();
					screenAudioProducer = null as unknown as MediaSoup.types.Producer;
				}
			} catch (e: any) {
				console.error(e);
			}
		};
	}
}

export async function startCamera() {
	if (localCam) {
		return;
	}
	console.log("starting camera");
	try {
		localCam = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true,
		});
	} catch (e: any) {
		console.error("start camera error", e);
	}
}

// switch to sending video from the "next" camera device in our device
// list (if we have multiple cameras)
export async function cycleCamera() {
	if (!(camVideoProducer && camVideoProducer.track)) {
		console.warn("cannot cycle camera - no current camera track");
		return;
	}

	console.log("cycle camera");

	// find "next" device in device list
	const deviceId = await getCurrentDeviceId();
	const allDevices = await navigator.mediaDevices.enumerateDevices();
	const vidDevices = allDevices.filter((d) => d.kind === "videoinput");
	if (!(vidDevices.length > 1)) {
		console.warn("cannot cycle camera - only one camera");
		return;
	}
	let idx = vidDevices.findIndex((d) => d.deviceId === deviceId);
	if (idx === vidDevices.length - 1) {
		idx = 0;
	} else {
		idx += 1;
	}

	// get a new video stream. might as well get a new audio stream too,
	// just in case browsers want to group audio/video streams together
	// from the same device when possible (though they don't seem to,
	// currently)
	console.log("getting a video stream from new device", vidDevices[idx].label);
	localCam = await navigator.mediaDevices.getUserMedia({
		video: { deviceId: { exact: vidDevices[idx].deviceId } },
		audio: true,
	});

	// replace the tracks we are sending
	await camVideoProducer.replaceTrack({ track: localCam.getVideoTracks()[0] });
	await camAudioProducer.replaceTrack({ track: localCam.getAudioTracks()[0] });
}

export async function stopStreams() {
	if (!(localCam || localScreen)) {
		return;
	}
	if (!sendTransport) {
		return;
	}

	console.log("stop sending media streams");

	await roomClient.closeTransport.mutate({ transportId: sendTransport.id });

	// closing the sendTransport closes all associated producers. when
	// the camVideoProducer and camAudioProducer are closed,
	// mediasoup-client stops the local cam tracks, so we don't need to
	// do anything except set all our local variables to null.
	try {
		sendTransport.close();
	} catch (e: any) {
		console.error(e);
	}

	sendTransport = null!;
	camVideoProducer = null!;
	camAudioProducer = null!;
	screenVideoProducer = null!;
	screenAudioProducer = null!;
	localCam = null!;
	localScreen = null!;
}

export async function leaveRoom() {
	if (!joined) {
		return;
	}

	console.log("[Room] leaved the room");

	// stop polling
	clearInterval(pollingInterval);

	try {
		// close everything on the server-side (transports, producers, consumers)
		await roomClient.leave.mutate();
		// closing the transports closes all producers and consumers. we
		// don't need to do anything beyond closing the transports, except
		// to set all our local variables to their initial states
		recvTransport?.close();
		sendTransport?.close();
	} catch (e: any) {
		console.error(e);
	}

	recvTransport = null!;
	sendTransport = null!;
	camVideoProducer = null!;
	camAudioProducer = null!;
	screenVideoProducer = null!;
	screenAudioProducer = null!;
	localCam = null!;
	localScreen = null!;
	lastPollSyncData = {};
	consumers = [];
	joined = false;
}

export async function subscribeToTrack(peerId: string, mediaTag: string) {
	console.log("subscribe to track", peerId, mediaTag);

	// create a receive transport if we don't already have one
	if (!recvTransport) {
		recvTransport = await createTransport("recv");
	}

	// if we do already have a consumer, we shouldn't have called this
	// method
	const existingConsumer = findConsumerForTrack(peerId, mediaTag);
	if (existingConsumer) {
		console.error("already have consumer for track", peerId, mediaTag);
		return;
	}

	// ask the server to create a server-side consumer object and send
	// us back the info we need to create a client-side consumer
	const consumerParameters = await roomClient.recvTrack.mutate({
		mediaTag,
		mediaPeerId: peerId,
		rtpCapabilities: device.rtpCapabilities,
	});

	console.log("consumer parameters", consumerParameters);
	const consumer = await recvTransport.consume({
		...consumerParameters,
		appData: { peerId, mediaTag },
	});

	console.log("created new consumer", consumer.id);

	// the server-side consumer will be started in paused state. wait
	// until we're connected, then send a resume request to the server
	// to get our first keyframe and start displaying video
	while (recvTransport.connectionState !== "connected") {
		console.log("  transport connstate", recvTransport.connectionState);
		await sleep(100);
	}

	// okay, we're ready. let's ask the peer to send us media
	await resumeConsumer(consumer);

	// keep track of all our consumers
	consumers.push(consumer);
}

export async function unsubscribeFromTrack(peerId: string, mediaTag: string) {
	try {
		const consumer = findConsumerForTrack(peerId, mediaTag);
		if (!consumer) {
			return;
		}
		console.log("unsubscribe from track", peerId, mediaTag);
		await closeConsumer(consumer);
	} catch (e) {
		console.error(e);
	}
}

export async function pauseConsumer(consumer: MediaSoup.types.Consumer) {
	if (consumer) {
		try {
			console.log("pause consumer", consumer.appData.peerId, consumer.appData.mediaTag);
			await roomClient.pauseConsumer.mutate({ consumerId: consumer.id });
			consumer.pause();
		} catch (e) {
			console.error(e);
		}
	}
}

export async function resumeConsumer(consumer: MediaSoup.types.Consumer) {
	if (consumer) {
		try {
			console.log("resume consumer", consumer.appData.peerId, consumer.appData.mediaTag);
			await roomClient.resumeConsumer.mutate({ consumerId: consumer.id });
			consumer.resume();
		} catch (e) {
			console.error(e);
		}
	}
}

export async function pauseProducer(producer: MediaSoup.types.Producer) {
	if (producer) {
		try {
			console.log("pause producer", producer.appData.mediaTag);
			await roomClient.pauseProducer.mutate({ producerId: producer.id });
			producer.pause();
		} catch (e) {
			console.error(e);
		}
	}
}

export async function resumeProducer(producer: MediaSoup.types.Producer) {
	if (producer) {
		try {
			console.log("resume producer", producer.appData.mediaTag);
			await roomClient.resumeProducer.mutate({ producerId: producer.id });
			producer.resume();
		} catch (e) {
			console.error(e);
		}
	}
}

async function closeConsumer(consumer: MediaSoup.types.Consumer) {
	try {
		if (!consumer) {
			return;
		}
		console.log("closing consumer", consumer.appData.peerId, consumer.appData.mediaTag);

		// tell the server we're closing this consumer. (the server-side
		// consumer may have been closed already, but that's okay.)
		await roomClient.closeConsumer.mutate({ consumerId: consumer.id });
		consumer.close();

		consumers = consumers.filter((c) => c !== consumer);
	} catch (e) {
		console.error(e);
	}
}

// utility function to create a transport and hook up signaling logic
// appropriate to the transport's direction
async function createTransport(direction: string): Promise<MediaSoup.types.Transport> {
	console.log(`create ${direction} transport`);

	// ask the server to create a server-side transport object and send
	// us back the info we need to create a client-side transport
	let transport: MediaSoup.types.Transport;
	const { transportOptions } = await roomClient.createTransport.mutate({ direction });
	console.log("transport options", transportOptions);

	if (direction === "recv") {
		transport = device.createRecvTransport(transportOptions);
	} else if (direction === "send") {
		transport = device.createSendTransport(transportOptions);
	} else {
		throw new Error(`bad transport 'direction': ${direction}`);
	}

	// mediasoup-client will emit a connect event when media needs to
	// start flowing for the first time. send dtlsParameters to the
	// server, then call callback() on success or errback() on failure.
	transport.on("connect", (params, callback, errback) => {
		const dtlsParameters = params.dtlsParameters;
		console.log("transport connect event", direction);

		roomClient.connectTransport
			.mutate({
				transportId: transportOptions.id,
				dtlsParameters,
			})
			.then(() => {
				callback();
			})
			.catch((err) => {
				console.error("error connecting transport", direction, err);
				errback(err);
			});
	});

	if (direction === "send") {
		// sending transports will emit a produce event when a new track
		// needs to be set up to start sending. the producer's appData is
		// passed as a parameter
		transport.on("produce", (params: any, callback: any, errback: any) => {
			const { kind, rtpParameters, appData } = params;
			console.log("transport produce event", appData.mediaTag);

			// we may want to start out paused (if the checkboxes in the ui
			// aren't checked, for each media type. not very clean code, here
			// but, you know, this isn't a real application.)
			let paused = false;
			if (appData.mediaTag === "cam-video") {
				paused = getCamPausedState();
			} else if (appData.mediaTag === "cam-audio") {
				paused = getMicPausedState();
			}

			// tell the server what it needs to know from us in order to set
			// up a server-side producer object, and get back a
			// producer.id. call callback() on success or errback() on
			// failure.
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
					callback({ id: producerId });
				})
				.catch((err) => {
					console.error("error setting up server-side producer", err);
					errback(err);
				});
		});
	}

	// for this simple demo, any time a transport transitions to closed,
	// failed, or disconnected, leave the room and reset
	transport.on("connectionstatechange", async (state: string) => {
		console.log(`transport ${transport.id} connectionstatechange ${state}`);

		// for this simple sample code, assume that transports being
		// closed is an error (we never close these transports except when
		// we leave the room)
		if (state === "closed" || state === "failed" || state === "disconnected") {
			console.log("transport closed ... leaving the room and resetting");
			leaveRoom();
		}
	});

	return transport;
}

//
// polling/update logic
//
let localBuildCounter = -1;
async function pollAndUpdate() {
	const { peers, activeSpeaker, buildCounter } = await roomClient.sync.query();
	if (buildCounter > localBuildCounter && localBuildCounter != -1) {
		window.location.reload();
	} else {
		localBuildCounter = buildCounter;
	}

	// update active speaker
	currentActiveSpeaker = activeSpeaker;

	// decide if we need to update tracks list
	// build list of peers, sorted by join time, removing last
	// seen time and stats, so we can easily do a deep-equals
	// comparison. compare this list with the cached list from last poll.
	const thisPeersList = sortPeers(peers);
	const lastPeersList = sortPeers(lastPollSyncData);

	if (!DeepEqual(thisPeersList, lastPeersList)) {
		// Update happens in UI, which we've removed
	}

	// if a peer has gone away, we need to close all consumers we have
	// for that peer
	for (const id in lastPollSyncData) {
		if (!peers[id]) {
			console.log(`peer ${id} has exited`);
			consumers.forEach((consumer) => {
				if (consumer.appData.peerId === id) {
					closeConsumer(consumer);
				}
			});
		}
	}

	// if a peer has stopped sending media that we are consuming, we
	// need to close the consumer
	consumers.forEach((consumer) => {
		const appData = consumer.appData as { peerId: string; mediaTag: string };
		const peerId = appData.peerId;
		const mediaTag = appData.mediaTag;

		// Type guard to ensure peers[peerId] is an object
		if (!peers[peerId] || typeof peers[peerId] !== "object") {
			console.log(`peer ${peerId} has exited or is invalid`);
			closeConsumer(consumer);
			return;
		}

		// Access media safely
		const peer = peers[peerId] as Record<string, any>;
		if (!peer.media || typeof peer.media !== "object") {
			console.log(`peer ${peerId} has no media`);
			closeConsumer(consumer);
			return;
		}

		// Check if the specific mediaTag exists
		if (!Object.prototype.hasOwnProperty.call(peer.media, mediaTag)) {
			console.log(`peer ${peerId} has stopped transmitting ${mediaTag}`);
			closeConsumer(consumer);
		}
	});

	lastPollSyncData = peers;
	return {}; // return an empty object if there isn't an error
}

function sortPeers(peers: Record<string, any>) {
	return Object.entries(peers)
		.map(([id, info]) => ({ id, joinTs: info.joinTs, media: { ...info.media } }))
		.sort((a, b) => (a.joinTs > b.joinTs ? 1 : b.joinTs > a.joinTs ? -1 : 0));
}

function findConsumerForTrack(peerId: string, mediaTag: string): MediaSoup.types.Consumer | undefined {
	return consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

//
// These functions are placeholders that replace the UI interactions
// They can be modified to provide appropriate behavior as needed
//

// Default values for states (replacing UI checkboxes)
let camPausedState = false;
let micPausedState = false;
let screenPausedState = false;
let screenAudioPausedState = false;

export function getCamPausedState(): boolean {
	return camPausedState;
}

export function getMicPausedState(): boolean {
	return micPausedState;
}

export function getScreenPausedState(): boolean {
	return screenPausedState;
}

export function getScreenAudioPausedState(): boolean {
	return screenAudioPausedState;
}

export async function changeCamPaused(paused?: boolean) {
	camPausedState = paused !== undefined ? paused : !camPausedState;
	if (camPausedState) {
		await pauseProducer(camVideoProducer);
	} else {
		await resumeProducer(camVideoProducer);
	}
}

export async function changeMicPaused(paused?: boolean) {
	micPausedState = paused !== undefined ? paused : !micPausedState;
	if (micPausedState) {
		await pauseProducer(camAudioProducer);
	} else {
		await resumeProducer(camAudioProducer);
	}
}

export async function changeScreenPaused(paused?: boolean) {
	screenPausedState = paused !== undefined ? paused : !screenPausedState;
	if (screenPausedState) {
		await pauseProducer(screenVideoProducer);
	} else {
		await resumeProducer(screenVideoProducer);
	}
}

export async function changeScreenAudioPaused(paused?: boolean) {
	screenAudioPausedState = paused !== undefined ? paused : !screenAudioPausedState;
	if (screenAudioPausedState) {
		await pauseProducer(screenAudioProducer);
	} else {
		await resumeProducer(screenAudioProducer);
	}
}

export async function getCurrentDeviceId() {
	if (!camVideoProducer || !camVideoProducer.track) {
		return null;
	}
	const deviceId = camVideoProducer.track.getSettings().deviceId;
	if (deviceId) {
		return deviceId;
	}
	// Firefox doesn't have deviceId in MediaTrackSettings object
	const track = localCam && localCam.getVideoTracks()[0];
	if (!track) {
		return null;
	}
	const devices = await navigator.mediaDevices.enumerateDevices();
	const deviceInfo = devices.find((d) => d.label.startsWith(track.label));
	return deviceInfo ? deviceInfo.deviceId : null;
}

//
// encodings for outgoing video
//

// just two resolutions, for now, as chrome 75 seems to ignore more
// than two encodings
const CAM_VIDEO_SIMULCAST_ENCODINGS = [
	{ maxBitrate: 96000, scaleResolutionDownBy: 4 },
	{ maxBitrate: 680000, scaleResolutionDownBy: 1 },
];

function camEncodings() {
	return CAM_VIDEO_SIMULCAST_ENCODINGS;
}

// how do we limit bandwidth for screen share streams?
function screenshareEncodings() {
	return [{ maxBitrate: 5000000 }];
}

//
// promisified sleep
//
async function sleep(ms: number) {
	return new Promise<void>((r) => setTimeout(() => r(), ms));
}
