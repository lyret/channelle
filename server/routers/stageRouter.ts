import type * as MediaSoup from "mediasoup";
import type { Transport, CustomAppData, MediaTag, Producer, Consumer, ActiveSpeaker, MediaSession } from "../_types";
import { TRPCError } from "@trpc/server";
import { trpc, mediaSoupRouter } from "../lib";
import { z } from "zod";
import Emittery from "emittery";
import { authenticatedPeerProcedure } from "./authRouter";

// Internal event emitter for media updates
const _updateEmitter = new Emittery<{
	sessionRemoved: MediaSession;
	sessionUpdated: MediaSession;
	sessionAdded: MediaSession;
	producerAdded: Producer;
	producerRemoved: Producer;
	producerPaused: Producer;
	producerResumed: Producer;
	consumerAdded: Consumer;
	consumerRemoved: Consumer;
	activeSpeaker: ActiveSpeaker | null;
}>();

// Get the trcp router constructor and default procedure
const { router, procedure } = trpc();

// On the server we keep lists of transports, producers, and
// consumers. whenever we create a transport, producer, or consumer,
// we save the remote peerId in the object's `appData`. for producers
// and consumers we also keep track of the client-side "media tag", to
// correlate tracks.

/** Internal in-memory map of active media communcation sessions */
const _sessions: Record<string, MediaSession> = {};
/** Internal in-memory map of active media transports */
const _transports: Record<string, Transport> = {};
/** Internal in-memory map of active media producers */
const _producers: Record<string, Producer> = {};
/** Internal in-memory map of active media consumers */
const _consumers: Record<string, Consumer> = {};

/**
 * with Media connection procedure
 * Only allows identified peers to continue, and keeps their media session updated
 */
const mediaSessionProcedure = authenticatedPeerProcedure.use(async ({ ctx, next }) => {
	// Make sure we have a session for this peer
	if (!_sessions[ctx.peer.id]) {
		const now = Date.now();
		_sessions[ctx.peer.id] = {
			peer: ctx.peer,
			joinTs: now,
			lastSeenTs: now,
			consumerLayers: {},
			media: {},
			stats: {},
		};
		_updateEmitter.emit("sessionAdded", _sessions[ctx.peer.id]);
	}
	// Update our most-recently-seem timestamp -- we're not stale!
	else {
		_sessions[ctx.peer.id].lastSeenTs = Date.now();
	}

	return next({ ctx });
});

/**
 * Stage Router
 * Handles server and client communication for orchastrating peer to peer media transmission
 */
export const stageRouter = router({
	/** Subscription for stage media room per show id (global in stage mode) with automatic updates */
	room: procedure.subscription(async function* ({ ctx: { peer } }): AsyncGenerator<{
		type: "initial" | "sessionChange" | "producerChange" | "consumerNeeded" | "consumerClosed" | "transportNeeded" | "activeSpeaker" | "error";
		sessions?: Record<string, MediaSession>;
		producers?: Record<string, { peerId: string; mediaTag: MediaTag; paused: boolean }>;
		consumers?: Array<{ peerId: string; mediaTag: MediaTag; consumerId?: string }>;
		needsSendTransport?: boolean;
		needsRecvTransport?: string[];
		activeSpeaker?: ActiveSpeaker | null;
		error?: string;
	}> {
		console.log(`[Stage] Peer ${peer.id} subscribed to the media room`);

		// Send initial state
		const currentSessions: Record<string, MediaSession> = {};
		const currentProducers: Record<string, { peerId: string; mediaTag: MediaTag; paused: boolean }> = {};
		const availableConsumers: Array<{ peerId: string; mediaTag: MediaTag }> = [];

		// Gather current state
		for (const [peerId, session] of Object.entries(_sessions)) {
			currentSessions[peerId] = session;
			// Find producers for this peer
			for (const [producerId, producer] of Object.entries(_producers)) {
				if (producer.appData.peerId === peerId) {
					currentProducers[producerId] = {
						peerId: peerId,
						mediaTag: producer.appData.mediaTag as MediaTag,
						paused: producer.paused,
					};
					// Other peers can consume this
					if (peerId !== peer.id && !producer.paused) {
						availableConsumers.push({
							peerId: peerId,
							mediaTag: producer.appData.mediaTag as MediaTag,
						});
					}
				}
			}
		}

		// Check what transports this peer needs
		const needsSendTransport = !Object.values(_transports).some((t) => t.appData.peerId === peer.id && t.appData.clientDirection === "send");
		const peersNeedingRecvTransport: string[] = [];

		for (const consumer of availableConsumers) {
			const hasRecvTransport = Object.values(_transports).some(
				(t) => t.appData.peerId === peer.id && t.appData.clientDirection === "recv" && t.appData.producerPeerId === consumer.peerId,
			);
			if (!hasRecvTransport && !peersNeedingRecvTransport.includes(consumer.peerId)) {
				peersNeedingRecvTransport.push(consumer.peerId);
			}
		}

		yield {
			type: "initial",
			sessions: currentSessions,
			producers: currentProducers,
			consumers: availableConsumers,
			needsSendTransport,
			needsRecvTransport: peersNeedingRecvTransport,
		};

		// Listen for all events
		for await (const [event, data] of _updateEmitter.anyEvent()) {
			switch (event) {
				case "sessionAdded":
				case "sessionRemoved":
				case "sessionUpdated":
					// Re-gather all sessions for simplicity
					const sessions: Record<string, MediaSession> = {};
					for (const [id, session] of Object.entries(_sessions)) {
						sessions[id] = session;
					}
					yield {
						type: "sessionChange",
						sessions,
					};
					break;

				case "producerAdded":
				case "producerRemoved":
				case "producerPaused":
				case "producerResumed":
					// Gather producer info
					const producers: Record<string, { peerId: string; mediaTag: MediaTag; paused: boolean }> = {};
					const consumers: Array<{ peerId: string; mediaTag: MediaTag }> = [];

					for (const [producerId, producer] of Object.entries(_producers)) {
						producers[producerId] = {
							peerId: producer.appData.peerId as string,
							mediaTag: producer.appData.mediaTag as MediaTag,
							paused: producer.paused,
						};

						// If this producer is from another peer and not paused, current peer might want to consume it
						if (producer.appData.peerId !== peer.id && !producer.paused) {
							consumers.push({
								peerId: producer.appData.peerId as string,
								mediaTag: producer.appData.mediaTag as MediaTag,
							});
						}
					}

					yield {
						type: "producerChange",
						producers,
						consumers,
					};
					break;

				case "activeSpeaker":
					yield {
						type: "activeSpeaker",
						activeSpeaker: data,
					};
					break;
			}
		}
	}),
	// Retruns the router rtpCapabilities for mediasoup-client device initialization
	routerRtpCapabilities: procedure.query(async () => {
		const msRouter = await mediaSoupRouter();
		return { routerRtpCapabilities: msRouter.rtpCapabilities };
	}),
	/** Subscription for the currently active speaker */
	activeSpeaker: procedure.subscription(async function* ({ ctx: { peer } }) {
		console.log(`[Stage] Client ${peer.id} subscribed to the currently active speaker`);

		yield null;

		for await (const activeSpeaker of _updateEmitter.events("activeSpeaker")) {
			if (!activeSpeaker) {
				yield null;
			} else {
				yield activeSpeaker;
			}
		}
	}),
	// Adds the peer from the room data structure and enables it to send and receive media
	startSession: procedure.mutation(async ({ ctx }) => {
		console.log("[Stage] Peer", ctx.peer.id, "joined");
		return;
	}),
	// Removes the peer from the room data structure and and closes
	// all associated media soup objects
	endSession: mediaSessionProcedure.mutation(async ({ ctx }) => {
		closeMediaPeer(ctx.peer.id);
		console.log("[Stage] Peer", ctx.peer.id, "left");
		return;
	}),
	// Create a mediasoup transport object and send back info needed
	// to create a transport object on the client side
	createTransport: mediaSessionProcedure.input(z.object({ direction: z.string() })).mutation(async ({ ctx, input: { direction } }) => {
		console.log(`[MS] Creating a ${direction} transport for peer ${ctx.peer.id}`);

		try {
			const transport = await _createWebRtcTransport({ peerId: ctx.peer.id, direction });
			_transports[transport.id] = transport;

			const { id, iceParameters, iceCandidates, dtlsParameters } = transport;
			return {
				transportOptions: { id, iceParameters, iceCandidates, dtlsParameters },
			};
		} catch (error) {
			console.error("[MS] Error while creating a transport", error);
			throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create transport" });
		}
	}),
	// Called from inside a client's `transport.on('connect')` event
	// handler.
	connectTransport: mediaSessionProcedure
		.input(z.object({ transportId: z.string(), dtlsParameters: z.custom<MediaSoup.types.DtlsParameters>() }))
		.mutation(async ({ ctx, input: { transportId, dtlsParameters } }) => {
			const transport = _transports[transportId];

			if (!transport) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
			}

			console.log(`[MS] Connecting a ${transport.appData.clientDirection} transport for ${ctx.peer.id} to ${transport.appData.peerId}`);

			await transport.connect({ dtlsParameters });
			return { connected: true };
		}),
	// Called by a client that wants to close a single transport (for
	// example, a client that is no longer sending any media).
	closeTransport: mediaSessionProcedure.input(z.object({ transportId: z.string() })).mutation(async ({ ctx, input: { transportId } }) => {
		const transport = _transports[transportId];

		if (!transport) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
		}

		console.log("[MS] Closing transport for", ctx.peer.id);

		await _closeTransport(transport);
		return { closed: true };
	}),
	// Called from inside a client's `transport.on('produce')` event handler.
	sendTrack: mediaSessionProcedure
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
			const transport = _transports[transportId];

			if (!transport) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side transport ${transportId} not found` });
			}

			// Validate RTP parameters on server side
			if (!rtpParameters) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing rtpParameters" });
			}
			if (!rtpParameters.codecs || rtpParameters.codecs.length === 0) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid rtpParameters: missing codecs" });
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

			_producers[producer.id] = producer;
			_sessions[ctx.peer.id].media[appData.mediaTag] = {
				paused,
				encodings: rtpParameters.encodings,
			};

			// Emit producer added event
			_updateEmitter.emit("producerAdded", producer);
			// Also emit session updated so clients know about media change
			_updateEmitter.emit("sessionUpdated", _sessions[ctx.peer.id]);

			return { id: producer.id };
		}),
	// Receive Track
	// Create a mediasoup consumer object, hook it up to a producer here
	// on the server side, and send back info needed to create a consumer
	// object on the client side. always start consumers paused. client
	// will request media to resume when the connection completes
	recvTrack: mediaSessionProcedure
		.input(z.object({ mediaPeerId: z.string(), mediaTag: z.custom<MediaTag>(), rtpCapabilities: z.custom<MediaSoup.types.RtpCapabilities>() }))
		.mutation(async ({ ctx, input: { mediaPeerId, mediaTag, rtpCapabilities } }) => {
			const producer = Object.values(_producers).find((p) => p.appData.mediaTag === mediaTag && p.appData.peerId === mediaPeerId);

			if (!producer) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer for ${mediaPeerId}:${mediaTag} not found` });
			}

			const msRouter = await mediaSoupRouter();

			if (!msRouter.canConsume({ producerId: producer.id, rtpCapabilities })) {
				throw new TRPCError({ code: "CONFLICT", message: `server-side producer for ${mediaPeerId}:${mediaTag} not found` });
			}

			const transport = Object.values(_transports).find((t) => t.appData.peerId === ctx.peer.id && t.appData.clientDirection === "recv");

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
			_consumers[consumer.id] = consumer;
			_sessions[ctx.peer.id].consumerLayers[consumer.id] = {
				currentLayer: null,
				clientSelectedLayer: null,
			};

			// Update above data structure when layer changes.
			consumer.on("layerschange", (layers) => {
				console.log(`[MS] Consumer layers changed ${mediaPeerId}->${ctx.peer.id}`, mediaTag, layers);
				if (_sessions[ctx.peer.id] && _sessions[ctx.peer.id].consumerLayers[consumer.id]) {
					_sessions[ctx.peer.id].consumerLayers[consumer.id].currentLayer = layers && layers.spatialLayer;
				}
			});

			console.log("[MS] Created consumer", consumer.id, "currentLayers", consumer.currentLayers, "for", ctx.peer.id, consumer.appData);

			// Emit consumer added event
			_updateEmitter.emit("consumerAdded", consumer);

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
	pauseConsumer: mediaSessionProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		console.log("[MS] Paused consumer for track", consumer.appData.peerId, consumer.appData.mediaTag);

		await consumer.pause();

		return { paused: true };
	}),
	// Resume Consumer
	// Called to resume receiving a track for a specific client
	resumeConsumer: mediaSessionProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _consumers[consumerId];

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
	closeConsumer: mediaSessionProcedure.input(z.object({ consumerId: z.string() })).mutation(async ({ input: { consumerId } }) => {
		const consumer = _consumers[consumerId];

		if (!consumer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
		}

		await _closeConsumer(consumer);

		// Emit consumer removed event
		_updateEmitter.emit("consumerRemoved", consumer);

		return { closed: true };
	}),
	// Consumer Set Layers
	// Called to set the largest spatial layer that a specific client
	// wants to receive
	consumerSetLayers: mediaSessionProcedure
		.input(z.object({ consumerId: z.string(), spatialLayer: z.any() }))
		.mutation(async ({ input: { consumerId, spatialLayer } }) => {
			const consumer = _consumers[consumerId];

			if (!consumer) {
				throw new TRPCError({ code: "NOT_FOUND", message: `server-side consumer ${consumerId} not found` });
			}

			console.log("[MS] Setting consumer layers", spatialLayer, consumer.appData);

			await consumer.setPreferredLayers({ spatialLayer });

			return { layersSet: true };
		}),
	// Pause Producer
	// Called to stop sending a track from a specific client
	pauseProducer: mediaSessionProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[MS] Paused producer", producer.appData);

		await producer.pause();

		_sessions[ctx.peer.id].media[producer.appData.mediaTag].paused = true;

		// Emit producer paused event
		_updateEmitter.emit("producerPaused", producer);
		// Also emit session updated so clients know about media change
		_updateEmitter.emit("sessionUpdated", _sessions[ctx.peer.id]);

		return { paused: true };
	}),
	// Resume Producer
	// Called to resume sending a track from a specific client
	resumeProducer: mediaSessionProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[MS] Resumed producer", producer.appData);

		producer.resume();

		_sessions[ctx.peer.id].media[producer.appData.mediaTag].paused = false;

		// Emit producer resumed event
		_updateEmitter.emit("producerResumed", producer);
		// Also emit session updated so clients know about media change
		_updateEmitter.emit("sessionUpdated", _sessions[ctx.peer.id]);

		return { resumed: true };
	}),
	// Close Producer
	// Called by a client that is no longer sending a specific track
	closeProducer: mediaSessionProcedure.input(z.object({ producerId: z.string() })).mutation(async ({ ctx, input: { producerId } }) => {
		const producer = _producers[producerId];

		if (!producer) {
			throw new TRPCError({ code: "NOT_FOUND", message: `server-side producer ${producerId} not found` });
		}

		console.log("[MS] Closed producer", ctx.peer.id, producer.appData);

		await _closeProducer(producer);
		// Update session media before emitting events
		if (_sessions[ctx.peer.id] && _sessions[ctx.peer.id].media[producer.appData.mediaTag]) {
			delete _sessions[ctx.peer.id].media[producer.appData.mediaTag];
		}
		_updateEmitter.emit("producerRemoved", producer);
		_updateEmitter.emit("sessionUpdated", _sessions[ctx.peer.id]);
		return { closed: true };
	}),
});

/** Stage Router Definition */
export type StageRouter = typeof stageRouter;

/** Intervalled function run to periodically clean up peers that disconnected without sending us a leaving message */
async function removeStalePeers() {
	// const now = Date.now();
	// for (const [id, peer] of Object.entries(_sessions)) {
	// 	if (now - peer.lastSeenTs > 4200) {
	// 		console.log(`[Stage] Removing stale peer ${id}`);
	// 		closeMediaPeer(id);
	// 	}
	// }
}
setInterval(removeStalePeers, 2000);

/** Intervalled function to update video statistics that we're sending to peers */
async function updatePeerStats() {
	for (const producer of Object.values(_producers)) {
		if (producer.kind !== "video") {
			continue;
		}
		try {
			const stats = await producer.getStats();
			const peerId = producer.appData.peerId;
			_sessions[peerId].stats[producer.id] = [];
			stats.forEach((s) => {
				_sessions[peerId].stats[producer.id].push({
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

	for (const consumer of Object.values(_consumers)) {
		try {
			const stats = Array.from((await consumer.getStats()).values()).find((s) => s.type === "outbound-rtp");
			const peerId = consumer.appData.peerId;
			if (!stats || !_sessions[peerId]) {
				continue;
			}
			_sessions[peerId].stats[consumer.id] = {
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
		_updateEmitter.emit("activeSpeaker", {
			producerId: producer.id,
			volume,
			peerId: (producer.appData as CustomAppData).peerId,
		});
	});
	audioLevelObserver.on("silence", () => {
		console.log("[MS] Audio-level silence event");
		_updateEmitter.emit("activeSpeaker", null);
	});
}
observeActiveSpeakers();

/** Utility function for closing the session and transports related to a given peer */
export async function closeMediaPeer(peerId: string) {
	console.log("[MS] Closing peer", peerId);
	_updateEmitter.emit("sessionRemoved", _sessions[peerId]);
	delete _sessions[peerId];
	for (const transport of Object.values(_transports)) {
		if (transport.appData.peerId === peerId) {
			await _closeTransport(transport);
		}
	}
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
		delete _transports[transport.id];
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
		delete _producers[producer.id];

		// remove this track's info from our room...mediaTag bookkeeping
		if (_sessions[producer.appData.peerId]) {
			delete _sessions[producer.appData.peerId].media[producer.appData.mediaTag];
		}
	} catch (e) {
		console.error(e);
	}
}

/** Utility function to close a given consumer */
async function _closeConsumer(consumer: Consumer) {
	console.log("[MS] Closing consumer", consumer.id, consumer.appData);
	consumer.close();

	// Remove this consumer from our _consumers list
	delete _consumers[consumer.id];

	// Remove layer info from from our _..consumerLayers bookkeeping
	if (_sessions[consumer.appData.peerId]) {
		delete _sessions[consumer.appData.peerId].consumerLayers[consumer.id];
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
