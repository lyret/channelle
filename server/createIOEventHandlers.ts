import type * as MediaSoup from "mediasoup";
import type * as IO from "socket.io";
import type {
	DataTypes
} from "../database";
import {
	client,
	Repository,
	RepositoryOperations,
	RepositoryOperationsThatIntroducesChanges,
} from "../database";
import type {
	SubscriptionMessage
} from "../shared/subscriptions";
import {
	createSubscriptionPath
} from "../shared/subscriptions";

import { mediaSoupRouter, ws } from "./lib/api";
import { createRTCResponseHandler } from "./lib/rtc";

import {
	userCameraBans,
	userMicrophoneBans,
	userOnlineStatus,
} from "./stores/users";

import { handleServerRTPCapabilitiesRequests as handleRTPCapabilitiesRequests } from "./lib/requestHandlers/capabilitiesRequestsHandlers";
import {
	handleRTCTransportConnectionRequests,
	handleRTCTransportCreationRequests,
	handleSendTransportProducingRequests,
} from "./lib/requestHandlers/transportRequestHandlers";
import {
	audioProducers,
	mediaProducerTransports,
	mediaReceiverTransports,
	videoProducers,
} from "./stores/media";

/** A map between connected sockets and participant ids for that socket */
const onlineParticipants = new Map<string, number>();

/**
 * Create event handlers for a newly connection clients (ie. a socket)
 */
export const createIOEventHandlers = async (socket: IO.Socket) => {
	// Debug output
	console.log(`[IO] ${socket.id} connected!`);

	// Handle connection errors
	socket.on("connect_error", (err) => {
		console.error("[IO] client connection error", err);
	});

	socket.on(
		"registerParticipant",
		async ({ participantId, hasFollowedInviteLinkForActors }, callback) => {
			try {
				let participant: DataTypes["participant"] | undefined = undefined;

				if (participantId && !Number.isNaN(participantId)) {
					participant = await client.participant.findFirst({
						where: { id: participantId },
					});
				}
				const makeManager =
					!CONFIG.runtime.production || (await client.participant.count()) == 0;
				const makeActor = makeManager || !!hasFollowedInviteLinkForActors;
				if (!participant) {
					participant = await client.participant.create({
						data: {
							name: "",
							manager: makeManager,
							actor: makeActor,
						},
					});
				}

				if (!participant) {
					return callback({ ok: false });
				}

				console.log(
					`[PARTICIPANT] ${socket.id} connected as ${participant.name} (id ${participant.id})`
				);
				onlineParticipants.set(socket.id, participant.id);
				userOnlineStatus.set(Number(participant.id), true);

				return callback({ ok: true, participant });
			} catch (err) {
				console.error(err);
				return callback({ ok: false });
			}
		}
	);

	socket.on("effects_trigger", async (_, callback) => {
		try {
			// Clients are not allowed to trigger effects directly
			callback(undefined);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error("Server Error"),
			});
		}
	});
	socket.on(
		"effects_add",
		async (data: { type: string; number: number }, callback) => {
			try {
				ws().emit("effects_trigger", {
					type: data.type,
					number: data.number,
				});
				callback(undefined);
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error("Server Error"),
				});
			}
		}
	);
	socket.on(
		"remove_producer",
		async (data: { audio?: boolean; video?: boolean }, callback) => {
			try {
				if (data.audio) {
					audioProducers.delete(socket.id);
				}
				if (data.video) {
					videoProducers.delete(socket.id);
				}
				//mediaProducerTransports.delete(socket.id);
				callback(true);
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error("Server Error"),
				});
			}
		}
	);
	socket.on("remove_consumer", async (_, callback) => {
		try {
			mediaReceiverTransports.delete(socket.id);
			callback(true);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error("Server Error"),
			});
		}
	});

	handleRTPCapabilitiesRequests(socket);
	handleRTCTransportCreationRequests(socket);
	handleRTCTransportConnectionRequests(socket);
	handleSendTransportProducingRequests(socket);

	// FIXME: working on this
	const handler = createRTCResponseHandler<{
		availableConsumptions: Array<{
			socketId: string;
			producerId: string;
			participantId: number;
			participant: DataTypes["participant"];
			id: string;
			kind: MediaSoup.types.MediaKind;
			rtpParameters: MediaSoup.types.RtpParameters;
		}>;
	}>("transport_receiver_consume", async () => {
		// Fail if no transport exists
		if (!mediaReceiverTransports.has(socket.id)) {
			throw new Error("Can't connect a non-existing receiver transport");
		}

		// Get transports for the connected socket
		const { options, transport, consumers } =
			mediaReceiverTransports.get(socket.id)!;

		// Close all existing consumers
		consumers.forEach((consumer) => consumer.close());

		// Create a record of what is available for consumption
		const availableConsumptions: Array<{
			socketId: string;
			producerId: string;
			participantId: number;
			participant: DataTypes["participant"];
			id: string;
			kind: MediaSoup.types.MediaKind;
			rtpParameters: MediaSoup.types.RtpParameters;
			type: MediaSoup.types.ConsumerType;
			producerPaused: boolean;
		}> = [];

		// Create a list of consumers
		const newConsumers: Array<MediaSoup.types.Consumer> = [];

		// Get the media soup router
		const router = await mediaSoupRouter();

		// Find all actors
		const participants: Record<number, DataTypes["participant"]> = (
			await client.participant.findMany({
				where: { OR: [{ actor: true }, { manager: true }] },
			})
		).reduce((record, participant) => {
			record[participant.id] = participant;
			return record;
		}, {});

		// Find all available consumptions from the active producers
		for (const [producerSocketId, producer] of [
			...videoProducers.entries(),
			...audioProducers.entries(),
		]) {
			// Skip self consumption
			if (socket.id == producerSocketId) {
				continue;
			}
			// Fail if unable to consume
			if (
				!router.canConsume({
					producerId: producer.id,
					rtpCapabilities: options.rtpCapabilities,
				})
			) {
				console.error(
					"Can not consume from producer from socket " + producerSocketId
				);
				continue;
			}

			// Find the participant for the producing socket
			const participantId = onlineParticipants.get(producerSocketId)!;

			// Check for bans
			// TODO: Banning here is really ineffective
			if (producer.kind == "video" && userCameraBans.has(participantId)) {
				console.error(
					"Can't consume the video producer from",
					participantId,
					"as it is banned"
				);
			} else if (
				producer.kind == "audio" &&
				userMicrophoneBans.has(participantId)
			) {
				console.error(
					"Can't consume the audio producer from",
					participantId,
					"as it is banned"
				);
			}

			// Create a consumer for the producer
			const consumer = await transport.consume({
				producerId: producer.id,
				rtpCapabilities: options.rtpCapabilities,
				paused: true,
			});

			// Update record keeping
			availableConsumptions.push({
				socketId: socket.id,
				producerId: producer.id,
				participantId,
				participant: participants[participantId],
				id: consumer.id,
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
				type: consumer.type,
				producerPaused: consumer.producerPaused,
			});
			newConsumers.push(consumer);
		}

		// Update receiver transport map
		mediaReceiverTransports.set(socket.id, {
			options,
			transport,
			consumers: newConsumers,
		});

		// Return available consumptions
		return { availableConsumptions };
	});
	handler(socket);

	socket.on("transport_receiver_resume", async (_, callback) => {
		try {
			// Fail if no transport exists
			if (!mediaReceiverTransports.has(socket.id)) {
				throw new Error("Can't resume a non-existing receiver transport");
			}
			const { consumers } = mediaReceiverTransports.get(socket.id)!;

			for (const consumer of consumers) {
				if (consumer.paused) {
					await consumer.resume();
				}
			}
			callback(undefined);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error("Server Error"),
			});
		}
	});

	// Handle socket disconnections
	socket.on("disconnect", () => {
		// Turn participant offline
		if (onlineParticipants.has(socket.id)) {
			try {
				const id = onlineParticipants.get(socket.id);
				onlineParticipants.delete(socket.id);
				if (
					Object.values(
						Object.fromEntries(onlineParticipants.entries())
					).findIndex((i) => i == id) == -1
				) {
					console.log(`[PARTICIPANT] ${id} left...`);
					userOnlineStatus.set(id, false);
				}
			} catch {}
		}

		// Remove any transports and media objects for the socket
		videoProducers.delete(socket.id);
		audioProducers.delete(socket.id);
		mediaProducerTransports.delete(socket.id);
		mediaReceiverTransports.delete(socket.id);
	});

	// When a subscription starts, it is added on a server side room for that subscription path
	// The current data is emitted to that single subscriber
	socket.on("subscribe", async (message: SubscriptionMessage) => {
		const path = createSubscriptionPath(message);
		const repository: Repository<any, any, any> =
			Repository._allRepositories[message.repository];
		try {
			if (!repository) {
				throw new Error(`No repository exists namned "${message.repository}"`);
			}
			// Join the path
			console.log(`[IO] ${socket.id} subscribed to ${path}`);
			socket.join(path);

			// Emit current data
			if (message.id) {
				repository.emitOne(message.id, socket);
			} else {
				repository.emitAll(socket);
			}
		} catch (error) {
			console.error(`[IO] Subscribe Error: ${error}`);
			return;
		}
	});

	// When a client want to stop a subscription, it is removed from the corresponding room
	socket.on("unsubscribe", async (message: SubscriptionMessage) => {
		const path = createSubscriptionPath(message);
		console.log(`[IO] ${socket.id} unsubscribed to ${path}`);
		socket.leave(path);
	});

	// Add database repository operations
	for (const operation of RepositoryOperations)
		socket.on(operation, async (message: SubscriptionMessage) => {
			const path = createSubscriptionPath(message);
			const repository: Repository<any, any, any> =
				Repository._allRepositories[message.repository];
			try {
				if (!repository) {
					throw new Error(
						`No repository exists namned "${message.repository}"`
					);
				}

				console.log(
					`[IO] ${socket.id} :: ${operation} :: ${path} :: ${JSON.stringify(message.args)}`
				);

				const result = await repository.operate(operation, message.args);

				// Emit the result back to the caller
				socket.emit(message.messageId, { data: result, ok: true });

				// Update all subscribers when data is modified
				if (RepositoryOperationsThatIntroducesChanges.includes(operation)) {
					if (message.id) {
						repository.emitOne(message.id);
						repository.emitAll();
					} else {
						repository.emitAll();
					}
				}
			} catch (error) {
				console.error(`[IO] ${operation} Error: ${error}`);
				socket.emit(message.messageId, { ok: false, error: `${error}` });
				return;
			}
		});
};

// FIXME: test
/** Stage Layout Value With Producers */
export type StageLayoutWithProducers = Array<
	Array<StageLayoutActorWithProducer | { type: "chat" } | { type: "empty" }>
>;

export type StageLayoutActorWithProducer = {
	type: "actor";
	participant: DataTypes["participant"];
	id: number;
	production: Array<{
		socketId: string;
		producerId: string;
		id: string;
		kind: MediaSoup.types.MediaKind;
		rtpParameters: MediaSoup.types.RtpParameters;
	}>;
};
