import type * as MediaSoup from "mediasoup";
import type { Transport, Peer, CustomAppData, MediaTag, Producer, Consumer } from "../_types";
import { TRPCError } from "@trpc/server";
import { trpc, mediaSoupRouter } from "../lib";
import { z } from "zod";

// Get the trcp router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * On the server we keep lists of transports, producers, and
 * consumers. whenever we create a transport, producer, or consumer,
 * we save the remote peerId in the object's `appData`. for producers
 * and consumers we also keep track of the client-side "media tag", to
 * correlate tracks.
 */
type Room = {
	password: string | undefined;
	curtains: boolean;
	peers: Record<string, Peer>;
	activeSpeaker: {
		producerId: string | null;
		volume: number | null;
		peerId: string | null;
	};
	// internal
	transports: {
		[id: string]: Transport;
	};
	producers: {
		[id: string]: Producer;
	};
	consumers: {
		[id: string]: Consumer;
	};
};

/** Internal state */
const _room: Room = {
	// Settings
	password: undefined,
	curtains: false,
	// Connections
	peers: {},
	activeSpeaker: {
		producerId: null,
		volume: null,
		peerId: null,
	},
	// MediaSoup
	transports: {},
	producers: {},
	consumers: {},
};

// Peer connection procedure
// Make sure this peer is connected. if we've disconnected the
// peer because of a network outage we want the peer to know that
// happened
const roomProcedure = trcpProcedure.use(async ({ ctx, next }) => {
	if (!ctx.peer?.id) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "No peer information given" });
	} else if (!_room.peers[ctx.peer.id]) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "The given peer has left the room" });
	} else {
		// Update our most-recently-seem timestamp -- we're not stale!
		_room.peers[ctx.peer.id].lastSeenTs = Date.now();
	}
	return next({ ctx: { peer: _room.peers[ctx.peer.id] } });
});

/**
 * Room Router
 * Handles server and client communication for orchastrating peer to peer media transmission
 */
export const roomRouter = trcpRouter({
	// Sync
	// Client polling endpoint. send back our 'peers' data structure and
	// 'activeSpeaker' info
	sync: roomProcedure.query(async () => {
		return {
			peers: _room.peers,
			activeSpeaker: _room.activeSpeaker,
			password: _room.password,
			curtains: _room.curtains,
		};
	}),
	// Join
	// Adds the peer to the room data structure and creates a
	// transport that the peer will use for receiving media. returns
	// router rtpCapabilities for mediasoup-client device initialization
	// Note: bypasses the standard room procedure
	join: trcpProcedure.mutation(async ({ ctx }) => {
		if (!ctx.peer?.id) {
			throw new TRPCError({ code: "BAD_REQUEST", message: "No peer information given" });
		}

		const msRouter = await mediaSoupRouter();
		const now = Date.now();

		_room.peers[ctx.peer.id] = {
			id: ctx.peer.id,
			media: {},
			consumerLayers: {},
			stats: {},
			name: "",
			actor: false,
			manager: false,
			banned: false,
			joinTs: now,
			..._room.peers[ctx.peer.id],
			lastSeenTs: now,
		};
		console.log("[Room]", ctx.peer.id, "joined as new peer");
		return { peerId: ctx.peer.id, routerRtpCapabilities: msRouter.rtpCapabilities };
	}),
	// Leave
	// Removes the peer from the room data structure and and closes
	// all associated mediasoup objects
	leave: roomProcedure.mutation(async ({ ctx }) => {
		const peerId = ctx.peer.id;
		_closePeer(peerId);
		console.log("[Room] Peer", peerId, "left");
		return;
	}),
	// Update Peer
	// Updates the information about a given peer
	updatePeer: roomProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				actor: z.boolean().optional(),
				manager: z.boolean().optional(),
				banned: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input: { id, name, actor, manager, banned } }) => {
			const peer = _room.peers[id];

			console.log({ ctx, id, name, actor, manager, banned });

			// Make sure that the peer in context is either the same as being updated or a manager
			if (!(ctx.peer.id == id || ctx.peer.manager)) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
			}

			// Find the peer
			if (!peer) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Peer with given id not found" });
			}

			// Update peer's name
			if (name !== undefined) {
				peer.name = name;
			}

			// Make sure that the peer in context is a manager
			if (!ctx.peer.manager) {
				return;
			}

			// Update peer's actor status
			if (actor !== undefined) {
				peer.actor = actor;
			}

			// Update peer's manager status
			if (manager !== undefined) {
				peer.manager = manager;
			}

			// Update peer's banned status
			if (banned !== undefined) {
				peer.banned = banned;
			}

			// Update the record of peers
			_room.peers[id] = peer;

			return;
		}),
	// Create Transport
	// Create a mediasoup transport object and send back info needed
	// to create a transport object on the client side
	createTransport: roomProcedure.input(z.object({ direction: z.string() })).mutation(async ({ ctx, input: { direction } }) => {
		console.log(`[MS] Creating a ${direction} transport for peer ${ctx.peer.id}`);

		const transport = await _createWebRtcTransport({ peerId: ctx.peer.id, direction });
		_room.transports[transport.id] = transport;

		const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
		return {
			transportOptions: { id, iceParameters, iceCandidates, dtlsParameters },
		};
	}),
	// Connect Transport
	// Called from inside a client's `transport.on('connect')` event
	// handler.
	connectTransport: roomProcedure
		.input(z.object({ transportId: z.string(), dtlsParameters: z.custom<MediaSoup.types.DtlsParameters>() }))
		.mutation(async ({ ctx, input: { transportId, dtlsParameters } }) => {
			const transport = _room.transports[transportId];

			if (!transport) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
			}

			console.log(`[MS] Connecting a ${transport.appData.clientDirection} transport for ${ctx.peer.id} to ${transport.appData.peerId}`);

			await transport.connect({ dtlsParameters });
			return { connected: true };
		}),
	// Close Transport
	// Called by a client that wants to close a single transport (for
	// example, a client that is no longer sending any media).
	closeTransport: roomProcedure.input(z.object({ transportId: z.string() })).mutation(async ({ ctx, input: { transportId } }) => {
		const transport = _room.transports[transportId];

		if (!transport) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
		}

		console.log("[MS] Closing transport for", ctx.peer.id);

		await _closeTransport(transport);
		return { closed: true };
	}),
	// Send Track
	// Called from inside a client's `transport.on('produce')` event handler.
	sendTrack: roomProcedure
		.input(
			z.object({
				transportId: z.string(),
				kind: z.custom<MediaSoup.types.MediaKind>(),
				rtpParameters: z.custom<MediaSoup.types.RtpParameters>(),
				paused: z.boolean().default(true),
				appData: z.custom<CustomAppData>(),
			}),
		)
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
				console.log(`[MS] Producer's (${producer.id}) transport closed`);
				_closeProducer(producer);
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
	// Receive Track
	// Create a mediasoup consumer object, hook it up to a producer here
	// on the server side, and send back info needed to create a consumer
	// object on the client side. always start consumers paused. client
	// will request media to resume when the connection completes
	recvTrack: roomProcedure
		.input(z.object({ mediaPeerId: z.string(), mediaTag: z.custom<MediaTag>(), rtpCapabilities: z.custom<MediaSoup.types.RtpCapabilities>() }))
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
				console.log(`[MS] Consumer's (${consumer.id}) transport closed`);
				_closeConsumer(consumer);
			});
			consumer.on("producerclose", () => {
				console.log(`[MS] Consumer's (${consumer.id}) producer closed`);
				_closeConsumer(consumer);
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
				console.log(`[MS] Consumer layers changed ${mediaPeerId}->${ctx.peer.id}`, mediaTag, layers);
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
	// Pause Consumer
	// Called to pause receiving a track for a specific client
	pauseConsumer: roomProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _room.consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		console.log("[MS] Paused consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);

		await consumer.pause();

		return { paused: true };
	}),
	// Resume Consumer
	// Called to resume receiving a track for a specific client
	resumeConsumer: roomProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _room.consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		console.log("[MS] Resumed consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);

		await consumer.resume();

		return { resumed: true };
	}),
	// Close Consumer
	// Called to stop receiving a track for a specific client. close and
	// clean up consumer object
	closeConsumer: roomProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _room.consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		await _closeConsumer(consumer);

		return { closed: true };
	}),
	// Consumer Set Layers
	// Called to set the largest spatial layer that a specific client
	// wants to receive
	consumerSetLayers: roomProcedure
		.input(z.object({ consumerId: z.string(), spatialLayer: z.any() }))
		.mutation(async ({ input: { consumerId, spatialLayer } }) => {
			const consumer = _room.consumers[consumerId];

			if (!consumer) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
			}

			console.log("[MS] Setting consumer layers", spatialLayer, consumer.appData);

			await consumer.setPreferredLayers({ spatialLayer });

			return { layersSet: true };
		}),
	// Pause Producer
	// Called to stop sending a track from a specific client
	pauseProducer: roomProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _room.producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[MS] Paused producer", producer.appData);

		await producer.pause();

		_room.peers[ctx.peer.id].media[producer.appData.mediaTag].paused = true;

		return { paused: true };
	}),
	// Resume Producer
	// Called to resume sending a track from a specific client
	resumeProducer: roomProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _room.producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[MS] Resumed producer", producer.appData);

		producer.resume();

		_room.peers[ctx.peer.id].media[producer.appData.mediaTag].paused = false;

		return { resumed: true };
	}),
	// Close Producer
	// Called by a client that is no longer sending a specific track
	closeProducer: roomProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _room.producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[MS] Closed producer", ctx.peer.id, producer.appData);

		await _closeProducer(producer);
		return { closed: true };
	}),
});

/** Room Router Definition */
export type RoomRouter = typeof roomRouter;

/** Intervalled function run to periodically clean up peers that disconnected without sending us a leaving message */
async function removeStalePeers() {
	const now = Date.now();
	for (const [id, peer] of Object.entries(_room.peers)) {
		if (now - peer.lastSeenTs > 15000) {
			console.log(`[Room] Removing stale peer ${id}`);
			_closePeer(id);
		}
	}
}
setInterval(removeStalePeers, 1000);

/** Intervalled function to update video statistics that we're sending to peers */
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
			console.warn("[MS] Error while updating producer stats", e);
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
			console.warn("[MS] Error while updating consumer stats", e);
		}
	}
}
setInterval(updatePeerStats, 3000);

/** Creates an Audio Level Observer for signaling active speakers */
async function observeActiveSpeakers() {
	const _router = await mediaSoupRouter();
	const audioLevelObserver = await _router.createAudioLevelObserver({
		interval: 800,
	});
	audioLevelObserver.on("volumes", (volumes) => {
		const { producer, volume } = volumes[0];
		console.log("[MS] Audio-level volumes event", producer.appData.peerId, volume);
		_room.activeSpeaker.producerId = producer.id;
		_room.activeSpeaker.volume = volume;
		_room.activeSpeaker.peerId = (producer.appData as CustomAppData).peerId;
	});
	audioLevelObserver.on("silence", () => {
		console.log("[MS] Audio-level silence event");
		_room.activeSpeaker.producerId = null;
		_room.activeSpeaker.volume = null;
		_room.activeSpeaker.peerId = null;
	});
}
observeActiveSpeakers();

/** Utility function to closing the transports related to a given peer */
function _closePeer(peerId: string) {
	console.log("[MS] closing peer", peerId);
	for (const transport of Object.values(_room.transports)) {
		if (transport.appData.peerId === peerId) {
			_closeTransport(transport);
		}
	}
	delete _room.peers[peerId];
}

/** Utility function to close a given transport */
async function _closeTransport(transport: Transport) {
	try {
		console.log("[MS] Closing transport", transport.id, transport.appData);

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

/** Utility function to close a given producer */
async function _closeProducer(producer: Producer) {
	console.log("[MS] Closing producer", producer.id, producer.appData);
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

/** Utility function to close a given consumer */
async function _closeConsumer(consumer: Consumer) {
	console.log("[MS] Closing consumer", consumer.id, consumer.appData);
	consumer.close();

	// Remove this consumer from our _room.consumers list
	_room.consumers = Object.fromEntries(Object.entries(_room.consumers).filter(([, c]) => c.id !== consumer.id));

	// Remove layer info from from our _room...consumerLayers bookkeeping
	if (_room.peers[consumer.appData.peerId]) {
		delete _room.peers[consumer.appData.peerId].consumerLayers[consumer.id];
	}
}

/** Utility function to create a WebRTC Transport */
async function _createWebRtcTransport({ peerId, direction }): Promise<Transport> {
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
