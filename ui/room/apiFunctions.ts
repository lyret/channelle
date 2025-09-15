import * as MediaSoup from "mediasoup-client";
import DeepEqual from "deep-equal";
import { writable, derived, get } from "svelte/store";
import { roomClient } from "./roomClient";
import type { CustomAppData, MediaTag, Transport, Producer, Consumer, TransportDirection, Peer } from "./types";

// ============================================================================
// SVELTE STORES
// ============================================================================

/**
 * MediaSoup device instance for WebRTC capabilities
 * Initialized when joining a room with router RTP capabilities
 */
export const deviceStore = writable<MediaSoup.types.Device | null>(null);

/**
 * Indicates whether the client has successfully joined the room
 */
export const joinedStore = writable(false);

/**
 * General paused state for media streaming
 * @deprecated Consider using camPausedStore and micPausedStore instead
 */
export const paused = writable(false);

/**
 * Local media stream containing audio/video tracks from user's devices
 * Set when accessing user media through getUserMedia
 */
export const localMediaStream = writable<MediaStream | null>(null);

/**
 * Transport for receiving media from other peers
 * Created on-demand when subscribing to remote tracks
 */
export const recvTransport = writable<Transport | null>(null);

/**
 * Transport for sending media to other peers
 * Created when starting to send media streams
 */
export const sendTransport = writable<Transport | null>(null);

/**
 * Producer for sending video track to server
 * Created when producing video media
 */
export const videoProducer = writable<Producer | null>(null);

/**
 * Producer for sending audio track to server
 * Created when producing audio media
 */
export const audioProducer = writable<Producer | null>(null);

/**
 * Currently active speaker in the room
 * Updated periodically through room sync
 */
export const currentActiveSpeakerStore = writable<{ peerId?: string | null }>({});

/**
 * List of all active consumers for receiving remote media
 * Each consumer represents a remote track being received
 */
export const consumersStore = writable<Consumer[]>([]);

/**
 * This client's peer ID assigned by the server
 * Set when joining the room
 */
export const myPeerIdStore = writable<string>("");

/**
 * Map of all peers in the room with their metadata
 * Updated periodically through room sync
 */
export const peersStore = writable<Record<string, any>>({});

/**
 * Camera paused state
 * When true, video track is paused
 */
export const camPausedStore = writable(false);

/**
 * Microphone paused state
 * When true, audio track is paused
 */
export const micPausedStore = writable(false);

// ============================================================================
// INTERNAL STATE (NOT EXPOSED AS STORES)
// ============================================================================

// These are truly internal and don't need to be reactive
let _pollingInterval: ReturnType<typeof setInterval> | undefined;
let _previousSyncedPeers: Record<string, any> = {};
let _localBuildCounter = -1;

// ============================================================================
// DERIVED STORES
// ============================================================================

/**
 * Indicates whether local camera/media stream is available
 */
export const hasLocalCamStore = derived(localMediaStream, ($localCam) => !!$localCam);

/**
 * Indicates whether send transport is available for outgoing media
 */
export const hasSendTransportStore = derived(sendTransport, ($transport) => !!$transport);

/**
 * Indicates whether receive transport is available for incoming media
 */
export const hasRecvTransportStore = derived(recvTransport, ($transport) => !!$transport);

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Join the room and initialize MediaSoup device
 * Sets up polling interval for room state synchronization
 */
export async function joinRoom() {
	// Signal that we're a new peer and initialize our
	// mediasoup-client device, if this is our first time connecting
	const { peerId, routerRtpCapabilities } = await roomClient.join.mutate();
	myPeerIdStore.set(peerId);
	joinedStore.set(true);
	console.log("[Room] Joined, my peerId is", peerId);

	// Initialize the MediaSoup device
	try {
		let device = get(deviceStore);
		if (!device) {
			device = new MediaSoup.Device();
			await device.load({ routerRtpCapabilities });
			deviceStore.set(device);
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
}

/**
 * Leave the room and clean up all resources
 * Stops polling, closes transports, and resets all state
 */
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
	const currentRecvTransport = get(recvTransport);
	const currentSendTransport = get(sendTransport);

	currentRecvTransport?.close();
	currentSendTransport?.close();

	_previousSyncedPeers = {};

	// Reset all stores
	recvTransport.set(null);
	sendTransport.set(null);
	videoProducer.set(null);
	audioProducer.set(null);
	localMediaStream.set(null);
	consumersStore.set([]);
	joinedStore.set(false);
	myPeerIdStore.set("");
}

/**
 * Synchronize room state with server
 * Updates peers, active speaker, and manages consumers
 * Called periodically via polling interval
 */
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
	const consumers = get(consumersStore);

	// If a peer has gone away, we need to close all consumers we have
	// for that peer
	if (!DeepEqual(thisPeersList, lastPeersList)) {
		for (const id in _previousSyncedPeers) {
			if (!peers[id]) {
				console.log(`[Room] Peer ${id} has left`);
				consumers.forEach((consumer) => {
					if (consumer.appData.peerId === id) {
						closeConsumer(consumer);
					}
				});
			}
		}
	}

	// If a peer has stopped sending media that we are consuming, we
	// need to close the consumer
	consumers.forEach((consumer) => {
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

/**
 * Access local media streams from the browser
 * @param audio - Whether to request audio access (default: true)
 * @param video - Whether to request video access (default: true)
 */
export async function startLocalMediaStream(audio: boolean = true, video: boolean = true) {
	console.log(`[Media] Accessing the local media stream (audio: ${audio ? 1 : 0}, video: ${video ? 1 : 0})`);
	const stream = await navigator.mediaDevices.getUserMedia({
		video: video,
		audio: audio,
	});
	localMediaStream.set(stream);
}

/**
 * Start transporting activated local streams to the server
 * Creates send transport and producers for audio/video tracks
 */
export async function sendMediaStreams() {
	console.log("[Room] Sending streams");

	// Make sure we're joined and have a local media stream
	if (!get(joinedStore)) {
		throw new Error("Not joined");
	}

	const stream = get(localMediaStream);
	if (!stream) {
		throw new Error("Local media stream not available");
	}

	// Create a transport for outgoing media, if we don't already have one
	let transport = get(sendTransport);
	if (!transport) {
		transport = await _createTransport("send");
		sendTransport.set(transport);
	}

	// Start sending video if we have a local video stream
	// the transport logic will initiate a
	// signaling conversation with the server to set up an outbound rtp
	// stream for the camera video track.
	if (stream.getVideoTracks().length > 0) {
		console.log(2, stream.getVideoTracks());
		const producer = await transport.produce({
			track: stream.getVideoTracks()[0],
			// Just two resolutions, for now, as chrome 75 seems to ignore more
			// than two encodings
			encodings: [
				{ maxBitrate: 96000, scaleResolutionDownBy: 4 },
				{ maxBitrate: 680000, scaleResolutionDownBy: 1 },
			],
			appData: { mediaTag: "cam-video", peerId: get(myPeerIdStore) },
		});
		console.log(3);
		videoProducer.set(producer);
		console.log(4);

		if (get(camPausedStore)) {
			producer.pause();
		}
	}

	// Start sending audio if we have a local audio stream
	if (stream.getAudioTracks().length > 0) {
		const producer = await transport.produce({
			track: stream.getAudioTracks()[0],
			appData: { mediaTag: "mic-audio", peerId: get(myPeerIdStore) },
		});
		audioProducer.set(producer);

		if (get(micPausedStore)) {
			try {
				producer.pause();
			} catch (e: any) {
				console.error(e);
			}
		}
	}
}

/**
 * Toggle video producer paused state
 * @param paused - Optional explicit paused state, toggles if not provided
 */
export async function toggleVideoPaused(paused?: boolean) {
	const currentPaused = get(camPausedStore);
	const newPaused = paused !== undefined ? paused : !currentPaused;
	camPausedStore.set(newPaused);

	const producer = get(videoProducer);
	if (newPaused && producer) {
		await pauseProducer(producer);
	} else if (!newPaused && producer) {
		await resumeProducer(producer);
	}
}

/**
 * Toggle audio producer paused state
 * @param paused - Optional explicit paused state, toggles if not provided
 */
export async function toggleAudioPaused(paused?: boolean) {
	const currentPaused = get(micPausedStore);
	const newPaused = paused !== undefined ? paused : !currentPaused;
	micPausedStore.set(newPaused);

	const producer = get(audioProducer);
	if (newPaused && producer) {
		await pauseProducer(producer);
	} else if (!newPaused && producer) {
		await resumeProducer(producer);
	}
}

/**
 * Stop transporting all media to the server
 * Closes send transport and all associated producers
 */
export async function closeMediaStreams() {
	const stream = get(localMediaStream);
	const transport = get(sendTransport);

	if (!stream || !transport) {
		return;
	}

	console.log("[MS] Stopping sending of media streams");
	await roomClient.closeTransport.mutate({ transportId: transport.id });

	// Closing the sendTransport closes all associated producers. when
	// the Video Producer and Audio Producer are closed,
	// mediasoup-client stops the local camera tracks, so we don't need to
	// do anything except set all our local variables to null.
	transport.close();

	// Reset all related stores
	sendTransport.set(null);
	videoProducer.set(null);
	audioProducer.set(null);
	localMediaStream.set(null);
}

/**
 * Subscribe to a remote track from a peer
 * Creates consumer for receiving the specified media
 * @param peerId - ID of the peer to subscribe to
 * @param mediaTag - Type of media to subscribe to (e.g., "cam-video", "mic-audio")
 */
export async function subscribeToTrack(peerId: string, mediaTag: MediaTag) {
	// Create a receiver transport if we don't already have one
	let transport = get(recvTransport);
	if (!transport) {
		transport = await _createTransport("recv");
		recvTransport.set(transport);
	}

	// If we do already have a consumer, we shouldn't have called this method
	const existingConsumer = _findConsumerForTrack(peerId, mediaTag);
	if (existingConsumer) {
		console.warn("[MS] There is already a consumer for this track", peerId, mediaTag);
		return;
	}

	console.log(`[Room] Subscribing to ${mediaTag} track from ${peerId}`);

	// Ask the server to create a server-side consumer object and send
	// us back the info we need to create a client-side consumer
	const device = get(deviceStore);
	if (!device) {
		throw new Error("Device not initialized");
	}

	const consumerParameters = await roomClient.recvTrack.mutate({
		mediaTag,
		mediaPeerId: peerId,
		rtpCapabilities: device.rtpCapabilities,
	});

	console.log("[MS] Got consumer parameters:", consumerParameters);

	const consumer = await transport.consume({
		...consumerParameters,
		appData: { peerId, mediaTag },
	});

	console.log("[MS] Created new consumer:", consumer.id);

	// The server-side consumer will be started in paused state. wait
	// until we're connected, then send a resume request to the server
	// to get our first keyframe and start displaying video
	while (transport.connectionState !== "connected") {
		console.log("[MS] transport connection state is ", transport.connectionState);
		await _sleep(100);
	}

	// Okay, we're ready. let's ask the peer to send us media
	await resumeConsumer(consumer);

	// Keep track of all our consumers
	consumersStore.update((consumers) => [...consumers, consumer]);
}

/**
 * Unsubscribe from a remote track
 * Closes the consumer for the specified peer and media
 * @param peerId - ID of the peer to unsubscribe from
 * @param mediaTag - Type of media to unsubscribe from
 */
export async function unsubscribeFromTrack(peerId: string, mediaTag: MediaTag) {
	const consumer = _findConsumerForTrack(peerId, mediaTag);
	if (!consumer) {
		console.warn("[MS] No consumer exists for this track", peerId, mediaTag);
		return;
	}
	console.log("[MS] unsubscribing from track", peerId, mediaTag);
	await closeConsumer(consumer);
}

/**
 * Get statistics about current track consumption
 * @returns Object with stats about active, paused, video, and audio consumers
 */
export function getTrackStats() {
	const consumers = get(consumersStore);
	const total = consumers.length;
	const paused = consumers.filter((c) => c.paused).length;
	const active = total - paused;
	const video = consumers.filter((c) => c.appData.mediaTag?.includes("video")).length;
	const audio = consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length;

	return {
		total,
		active,
		paused,
		video,
		audio,
	};
}

/**
 * Pause a consumer to stop receiving media
 * @param consumer - Consumer to pause
 */
export async function pauseConsumer(consumer: Consumer) {
	console.log("[MS] Pausing consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);
	await roomClient.pauseConsumer.mutate({ consumerId: consumer.id });
	consumer.pause();
}

/**
 * Resume a paused consumer to start receiving media
 * @param consumer - Consumer to resume
 */
export async function resumeConsumer(consumer: Consumer) {
	console.log("[MS] Resuming the consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);
	await roomClient.resumeConsumer.mutate({ consumerId: consumer.id });
	consumer.resume();
}

/**
 * Close and remove a consumer
 * @param consumer - Consumer to close
 */
export async function closeConsumer(consumer: Consumer) {
	console.log("[MS] Closing the consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);

	// Tell the server we're closing this consumer. (the server-side
	// consumer may have been closed already, but that's okay.)
	await roomClient.closeConsumer.mutate({ consumerId: consumer.id });
	consumer.close();

	consumersStore.update((consumers) => consumers.filter(({ id }) => id !== consumer.id));
}

/**
 * Pause all active consumers
 */
export async function pauseAllConsumers() {
	const consumers = get(consumersStore);
	for (const consumer of consumers) {
		if (!consumer.paused) {
			await pauseConsumer(consumer);
		}
	}
}

/**
 * Resume all paused consumers
 */
export async function resumeAllConsumers() {
	const consumers = get(consumersStore);
	for (const consumer of consumers) {
		if (consumer.paused) {
			await resumeConsumer(consumer);
		}
	}
}

/**
 * Close all consumers
 */
export async function closeAllConsumers() {
	const consumers = [...get(consumersStore)];
	for (const consumer of consumers) {
		await closeConsumer(consumer);
	}
}

/**
 * Pause a producer to stop sending media
 * @param producer - Producer to pause
 */
export async function pauseProducer(producer: Producer) {
	if (!producer.paused) {
		console.log("[MS] Pausing producer for", producer.appData.mediaTag);
		await roomClient.pauseProducer.mutate({ producerId: producer.id });
		producer.pause();
	}
}

/**
 * Resume a paused producer to start sending media
 * @param producer - Producer to resume
 */
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

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Create a transport and hook up signaling logic
 * @param direction - Direction of transport ("send" or "recv")
 * @returns Created transport
 */
async function _createTransport(direction: TransportDirection): Promise<Transport> {
	console.log(`[MS] Creating ${direction}-transport`);

	const device = get(deviceStore);
	if (!device) {
		throw new Error("Device not initialized");
	}

	// Ask the server to create a server-side transport object and send
	// us back the info we need to create a client-side transport
	let transport: MediaSoup.types.Transport<CustomAppData>;
	const { transportOptions } = await roomClient.createTransport.mutate({ direction });

	if (direction === "recv") {
		transport = device.createRecvTransport(transportOptions);
	} else if (direction === "send") {
		transport = device.createSendTransport(transportOptions);
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
				paused = get(camPausedStore);
			} else if (appData.mediaTag === "mic-audio") {
				paused = get(micPausedStore);
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
	// FIXME: Is this ok? Probably not.
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

/**
 * Find a consumer matching the given peer and media tag
 * @param peerId - Peer ID to search for
 * @param mediaTag - Media tag to search for
 * @returns Matching consumer or undefined
 */
function _findConsumerForTrack(peerId: string, mediaTag: MediaTag): Consumer | undefined {
	const consumers = get(consumersStore);
	return consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === mediaTag);
}

/**
 * Sort peers by join time
 * @param peers - Map of peers to sort
 * @returns Array of peers sorted by join timestamp
 */
function _sortPeers(peers: Record<string, Peer>): Array<Peer> {
	return Object.values(peers).sort((a, b) => (a.joinTs > b.joinTs ? 1 : b.joinTs > a.joinTs ? -1 : 0));
}

/**
 * Sleep utility for async delays
 * @param ms - Milliseconds to sleep
 */
async function _sleep(ms: number) {
	return new Promise<void>((r) => setTimeout(() => r(), ms));
}
