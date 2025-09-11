import type * as MediaSoup from "mediasoup";
import type { ExtendedAppData } from "../lib/api";
import { BroadcastChannel } from "broadcast-channel";
import { TRPCError } from "@trpc/server";
import { trcp, mediaSoupRouter } from "../lib/api";
import { z } from "zod";

const HTTP_PEER_STALE = 15000;

// Handle incomming debugging messages from the cli over trpc
// TODO: Move to a separate router
let buildCounter = 0;
if (CONFIG.runtime.debug) {
	const channel = new BroadcastChannel<{ type: "build-event"; data: any }>("cli-channel");
	channel.addEventListener("message", ({ type }) => {
		switch (type) {
			// Refresh the connected clients
			case "build-event":
				buildCounter++;
				break;
			// Unhandled messages
			default:
				console.log(`[DEBUG] Received unhandled ipc message of type: ${type}`);
				break;
		}
	});
}

const { router: trcpRouter, procedure: trcpProcedure } = trcp();

type Peer = {
	lastSeenTs: number;
	joinTs: number;
	media: any;
	consumerLayers: any;
	stats: any;
};

/**
 * Internally, we keep lists of transports, producers, and
 * consumers. whenever we create a transport, producer, or consumer,
 * we save the remote peerId in the object's `appData`. for producers
 * and consumers we also keep track of the client-side "media tag", to
 * correlate tracks.
 */
type Room = {
	peers: {
		[id: string]: Peer;
	};
	activeSpeaker: {
		producerId: string | null;
		volume: number | null;
		peerId: string | null;
	};
	// internal
	transports: {
		[id: string]: MediaSoup.types.WebRtcTransport<ExtendedAppData>;
	};
	producers: {
		[id: string]: MediaSoup.types.Producer<ExtendedAppData>;
	};
	consumers: {
		[id: string]: MediaSoup.types.Consumer<ExtendedAppData>;
	};
};

const _room: Room = {
	// External
	peers: {},
	activeSpeaker: {
		producerId: null,
		volume: null,
		peerId: null,
	},
	// Internal
	transports: {},
	producers: {},
	consumers: {},
};

// make sure this peer is connected. if we've disconnected the
// peer because of a network outage we want the peer to know that
// happened, when/if it returns
const roomProcedure = trcpProcedure.use(async ({ ctx, next }) => {
	if (!ctx.peer?.id) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "No peer information given" });
	} else if (!_room.peers[ctx.peer.id]) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "The given peer id has disconnected" });
	} else {
		// Update our most-recently-seem timestamp -- we're not stale!
		_room.peers[ctx.peer.id].lastSeenTs = Date.now();
	}
	return next({ ctx });
});

export const roomRouter = trcpRouter({
	// client polling endpoint. send back our 'peers' data structure and
	// 'activeSpeaker' info
	sync: roomProcedure.query(async () => {
		console.log("sync", _room);
		return {
			buildCounter: buildCounter,
			peers: _room.peers,
			activeSpeaker: _room.activeSpeaker,
		};
	}),
	// Adds the peer to the room data structure and creates a
	// transport that the peer will use for receiving media. returns
	// router rtpCapabilities for mediasoup-client device initialization
	// Note: bypasses the standard room procedure
	join: trcpProcedure.mutation(async ({ ctx }) => {
		if (!ctx.peer?.id) {
			throw new TRPCError({ code: "BAD_REQUEST", message: "No peer information given" });
		}

		const peerId = Math.round(Math.random() * 1000000).toString();
		const msRouter = await mediaSoupRouter();
		const now = Date.now();

		_room.peers[peerId] = {
			joinTs: now,
			lastSeenTs: now,
			media: {},
			consumerLayers: {},
			stats: {},
		};
		console.log("[Room]", peerId, "joined as new peer");
		return { peerId, routerRtpCapabilities: msRouter.rtpCapabilities };
	}),
	// Removes the peer from the room data structure and and closes
	// all associated mediasoup objects
	leave: roomProcedure.mutation(async ({ ctx }) => {
		const peerId = ctx.peer.id;
		closePeer(peerId);
		console.log("[Room] peer", peerId, "left");
		return;
	}),
	// Create a mediasoup transport object and send back info needed
	// to create a transport object on the client side
	createTransport: roomProcedure.input(z.object({ direction: z.string() })).mutation(async ({ ctx, input: { direction } }) => {
		console.log("create-transport", ctx.peer.id, direction);

		const transport = await createWebRtcTransport({ peerId: ctx.peer.id, direction });
		_room.transports[transport.id] = transport;

		const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
		return {
			transportOptions: { id, iceParameters, iceCandidates, dtlsParameters },
		};
	}),
	// Called from inside a client's `transport.on('connect')` event
	// handler.
	connectTransport: roomProcedure
		.input(z.object({ transportId: z.string(), dtlsParameters: z.any() }))
		.mutation(async ({ ctx, input: { transportId, dtlsParameters } }) => {
			const transport = _room.transports[transportId];

			if (!transport) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
			}

			console.log("connect-transport", ctx.peer.id, transport.appData);

			await transport.connect({ dtlsParameters });
			return { connected: true };
		}),
	// Called by a client that wants to close a single transport (for
	// example, a client that is no longer sending any media).
	closeTransport: roomProcedure.input(z.object({ transportId: z.string() })).mutation(async ({ ctx, input: { transportId } }) => {
		const transport = _room.transports[transportId];

		if (!transport) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
		}

		console.log("close-transport", ctx.peer.id, transport.appData);

		await closeTransport(transport);
		return { closed: true };
	}),

	// Called from inside a client's `transport.on('produce')` event handler.
	sendTrack: roomProcedure
		.input(z.object({ transportId: z.string(), kind: z.any(), rtpParameters: z.any(), paused: z.boolean().default(false), appData: z.any() }))
		.mutation(async ({ ctx, input: { transportId, kind, rtpParameters, paused, appData } }) => {
			const transport = _room.transports[transportId];

			if (!transport) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
			}

			const producer = await transport.produce({
				kind,
				rtpParameters,
				paused,
				appData: { ...appData, peerId: ctx.peer.id, transportId },
			});

			// If our associated transport closes, close ourself, too
			producer.on("transportclose", () => {
				console.log("producer's transport closed", producer.id);
				closeProducer(producer);
			});

			// Monitor audio level of this producer. we call addProducer() here,
			// but we don't ever need to call removeProducer() because the core
			// AudioLevelObserver code automatically removes closed producers
			// TODO: re-add
			// if (producer.kind === "audio") {
			// 	audioLevelObserver.addProducer({ producerId: producer.id });
			// }

			_room.producers[producer.id] = producer;
			_room.peers[ctx.peer.id].media[appData.mediaTag] = {
				paused,
				encodings: rtpParameters.encodings,
			};

			return { id: producer.id };
		}),
	// Create a mediasoup consumer object, hook it up to a producer here
	// on the server side, and send back info needed to create a consumer
	// object on the client side. always start consumers paused. client
	// will request media to resume when the connection completes
	recvTrack: roomProcedure
		.input(z.object({ mediaPeerId: z.string(), mediaTag: z.any(), rtpCapabilities: z.any() }))
		.mutation(async ({ ctx, input: { mediaPeerId, mediaTag, rtpCapabilities } }) => {
			const producer = Object.values(_room.producers).find((p) => p.appData.mediaTag === mediaTag && p.appData.peerId === mediaPeerId);

			if (!producer) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer for ${mediaPeerId}:${mediaTag} not found` });
			}

			const msRouter = await mediaSoupRouter();

			if (!msRouter.canConsume({ producerId: producer.id, rtpCapabilities })) {
				throw new TRPCError({ code: "CONFLICT", message: `server-side producer for ${mediaPeerId}:${mediaTag} not found` });
			}

			const transport = Object.values(_room.transports).find((t) => t.appData.peerId === ctx.peer.id && t.appData.clientDirection === "recv");

			if (!transport) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side recv transport for ${ctx.peer.id} not found` });
			}

			const consumer = await transport.consume({
				producerId: producer.id,
				rtpCapabilities,
				paused: true,
				appData: { peerId: ctx.peer.id, mediaPeerId, mediaTag },
			});

			// Need both 'transportclose' and 'producerclose' event handlers,
			// to make sure we close and clean up consumers in all
			// circumstances
			consumer.on("transportclose", () => {
				console.log("consumer's transport closed", consumer.id);
				closeConsumer(consumer);
			});
			consumer.on("producerclose", () => {
				console.log("consumer's producer closed", consumer.id);
				closeConsumer(consumer);
			});

			// Stick this consumer in our list of consumers to keep track of,
			// and create a data structure to track the client-relevant state
			// of this consumer
			_room.consumers[consumer.id] = consumer;
			_room.peers[ctx.peer.id].consumerLayers[consumer.id] = {
				currentLayer: null,
				clientSelectedLayer: null,
			};

			// Update above data structure when layer changes.
			consumer.on("layerschange", (layers) => {
				console.log(`consumer layerschange ${mediaPeerId}->${ctx.peer.id}`, mediaTag, layers);
				if (_room.peers[ctx.peer.id] && _room.peers[ctx.peer.id].consumerLayers[consumer.id]) {
					_room.peers[ctx.peer.id].consumerLayers[consumer.id].currentLayer = layers && layers.spatialLayer;
				}
			});

			return {
				producerId: producer.id,
				id: consumer.id,
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
				type: consumer.type,
				producerPaused: consumer.producerPaused,
			};
		}),
	// Called to pause receiving a track for a specific client
	pauseConsumer: roomProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _room.consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		console.log("pause-consumer", consumer.appData);

		await consumer.pause();

		return { paused: true };
	}),
	// Called to resume receiving a track for a specific client
	resumeConsumer: roomProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _room.consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		console.log("resume-consumer", consumer.appData);

		await consumer.resume();

		return { resumed: true };
	}),
	// Called to stop receiving a track for a specific client. close and
	// clean up consumer object
	closeConsumer: roomProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _room.consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		await closeConsumer(consumer);

		return { closed: true };
	}),
	// Called to set the largest spatial layer that a specific client
	// wants to receive
	consumerSetLayers: roomProcedure
		.input(z.object({ consumerId: z.string(), spatialLayer: z.any() }))
		.mutation(async ({ input: { consumerId, spatialLayer } }) => {
			const consumer = _room.consumers[consumerId];

			if (!consumer) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
			}

			console.log("consumer-set-layers", spatialLayer, consumer.appData);

			await consumer.setPreferredLayers({ spatialLayer });

			return { layersSet: true };
		}),
	// Called to stop sending a track from a specific client
	pauseProducer: roomProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _room.producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("pause-producer", producer.appData);

		await producer.pause();

		_room.peers[ctx.peer.id].media[producer.appData.mediaTag].paused = true;

		return { paused: true };
	}),

	// Called to resume sending a track from a specific client
	resumeProducer: roomProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _room.producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[Room] resume-producer", producer.appData);

		producer.resume();

		_room.peers[ctx.peer.id].media[producer.appData.mediaTag].paused = false;

		return { resumed: true };
	}),
	// Called by a client that is no longer sending a specific track
	closeProducer: roomProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _room.producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("close-producer", ctx.peer.id, producer.appData);

		await closeProducer(producer);
		return { closed: true };
	}),
});
export type RoomRouter = typeof roomRouter;

function closePeer(peerId: string) {
	console.log("closing peer", peerId);
	for (const transport of Object.values(_room.transports)) {
		if (transport.appData.peerId === peerId) {
			closeTransport(transport);
		}
	}
	delete _room.peers[peerId];
}

async function closeTransport(transport: MediaSoup.types.WebRtcTransport<ExtendedAppData>) {
	try {
		console.log("closing transport", transport.id, transport.appData);

		// our producer and consumer event handlers will take care of
		// calling closeProducer() and closeConsumer() on all the producers
		// and consumers associated with this transport
		transport.close();

		// so all we need to do, after we call transport.close(), is update
		// our _room data structure
		delete _room.transports[transport.id];
	} catch (e) {
		console.error(e);
	}
}

async function closeProducer(producer: MediaSoup.types.Producer<ExtendedAppData>) {
	console.log("closing producer", producer.id, producer.appData);
	try {
		producer.close();

		// Remove this producer from our room.producers list
		_room.producers = Object.fromEntries(Object.entries(_room.producers).filter(([, p]) => p.id !== producer.id));

		// remove this track's info from our room...mediaTag bookkeeping
		if (_room.peers[producer.appData.peerId]) {
			delete _room.peers[producer.appData.peerId].media[producer.appData.mediaTag];
		}
	} catch (e) {
		console.error(e);
	}
}

async function closeConsumer(consumer: MediaSoup.types.Consumer<ExtendedAppData>) {
	console.log("closing consumer", consumer.id, consumer.appData);
	consumer.close();

	// Remove this consumer from our _room.consumers list
	_room.consumers = Object.fromEntries(Object.entries(_room.consumers).filter(([, c]) => c.id !== consumer.id));

	// Remove layer info from from our _room...consumerLayers bookkeeping
	if (_room.peers[consumer.appData.peerId]) {
		delete _room.peers[consumer.appData.peerId].consumerLayers[consumer.id];
	}
}

async function createWebRtcTransport({ peerId, direction }) {
	const { listenInfos, initialAvailableOutgoingBitrate } = CONFIG.mediasoup.webRTCTransport;

	const _router = await mediaSoupRouter();
	const transport = await _router.createWebRtcTransport({
		listenInfos: listenInfos,
		enableUdp: true,
		enableTcp: true,
		preferUdp: true,
		initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate,
		appData: { peerId, clientDirection: direction },
	});

	return transport;
}

// Periodically clean up peers that disconnected without sending us
// a leaving message
async function removeStalePeers() {
	const now = Date.now();
	for (const [id, peer] of Object.entries(_room.peers)) {
		if (now - peer.lastSeenTs > HTTP_PEER_STALE) {
			console.warn(`removing stale peer ${id}`);
			closePeer(id);
		}
	}
}
setInterval(removeStalePeers, 1000);

// Periodically update video stats we're sending to peers
async function updatePeerStats() {
	for (const producer of Object.values(_room.producers)) {
		if (producer.kind !== "video") {
			continue;
		}
		try {
			const stats = await producer.getStats();
			const peerId = producer.appData.peerId;
			_room.peers[peerId].stats[producer.id] = [];
			stats.forEach((s) => {
				_room.peers[peerId].stats[producer.id].push({
					bitrate: s.bitrate,
					fractionLost: s.fractionLost,
					jitter: s.jitter,
					score: s.score,
					rid: s.rid,
				});
			});
		} catch (e) {
			console.warn("error while updating producer stats", e);
		}
	}

	for (const consumer of Object.values(_room.consumers)) {
		try {
			const stats = Array.from((await consumer.getStats()).values()).find((s) => s.type === "outbound-rtp");
			const peerId = consumer.appData.peerId;
			if (!stats || !_room.peers[peerId]) {
				continue;
			}
			_room.peers[peerId].stats[consumer.id] = {
				bitrate: stats.bitrate,
				fractionLost: stats.fractionLost,
				score: stats.score,
			};
		} catch (e) {
			console.warn("error while updating consumer stats", e);
		}
	}
}
setInterval(updatePeerStats, 3000);

// Create an Audio Level Observer for signaling active speakers
async function observeActiveSpeakers() {
	const _router = await mediaSoupRouter();
	const audioLevelObserver = await _router.createAudioLevelObserver({
		interval: 800,
	});
	audioLevelObserver.on("volumes", (volumes) => {
		const { producer, volume } = volumes[0];
		console.log("audio-level volumes event", producer.appData.peerId, volume);
		_room.activeSpeaker.producerId = producer.id;
		_room.activeSpeaker.volume = volume;
		_room.activeSpeaker.peerId = (producer.appData as ExtendedAppData).peerId;
	});
	audioLevelObserver.on("silence", () => {
		console.log("audio-level silence event");
		_room.activeSpeaker.producerId = null;
		_room.activeSpeaker.volume = null;
		_room.activeSpeaker.peerId = null;
	});
}
observeActiveSpeakers();
