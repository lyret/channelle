import type * as MediaSoupClient from 'mediasoup-client';
import type * as MediaSoup from 'mediasoup';
import * as IO from 'socket.io';
import {
	client,
	DataTypes,
	Repository,
	RepositoryOperations,
	RepositoryOperationsThatIntroducesChanges,
} from '../database';
import {
	MediaRequests,
	SubscriptionMessage,
	createSubscriptionPath,
} from '../shared/subscriptions';

import { createRTCResponseHandler, createRTCTransport } from './lib/rtc';
import { mediaSoupRouter, ws } from './lib/api';

import { userOnlineStatus } from './stores/users';

import {
	mediaProducerTransports,
	mediaReceiverTransports,
	videoProducers,
	audioProducers,
} from './stores/media';
import { stageLayout } from './stores/stage';
import {
	handleRTCTransportConnectionRequests,
	handleRTCTransportCreationRequests,
	handleSendTransportProducingRequests,
} from './lib/requestHandlers/transportRequestHandlers';
import { handleServerRTPCapabilitiesRequests as handleRTPCapabilitiesRequests } from './lib/requestHandlers/capabilitiesRequestsHandlers';

// FIXME: test
videoProducers.subscribe((data) => {
	ws().emit('producers_update');
});
audioProducers.subscribe((data) => {
	ws().emit('producers_update');
});
stageLayout.subscribe((data) => {
	console.log('LAYOUT', data);
	ws().emit('producers_update');
});

/** A map between connected sockets and participant ids for that socket */
const onlineParticipants = new Map<string, number>();

/**
 * Create event handlers for a newly connection clients (ie. a socket)
 */
export const createIOEventHandlers = async (socket: IO.Socket) => {
	// Debug output
	console.log(`[IO] ${socket.id} connected!`);

	// Handle connection errors
	socket.on('connect_error', (err) => {
		console.error('[IO] client connection error', err);
	});

	socket.on('registerParticipant', async ({ participantId }, callback) => {
		try {
			const participant = await (!participantId || Number.isNaN(participantId)
				? client.participant.create({
						data: {
							name: '',
							manager: true, // FIXME: quick fix for production bug (await client.participant.count()) == 0,
							actor: (await client.participant.count()) == 0,
						},
					})
				: client.participant.findFirst({
						where: { id: participantId },
					}));

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
	});

	socket.on('effects_trigger', async (_, callback) => {
		try {
			// Clients are not allowed to trigger effects directly
			callback(undefined);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error('Server Error'),
			});
		}
	});
	socket.on(
		'effects_add',
		async (data: { type: string; number: number }, callback) => {
			try {
				ws().emit('effects_trigger', {
					type: data.type,
					number: data.number,
				});
				callback(undefined);
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		}
	);
	socket.on(
		'remove_producer',
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
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		}
	);
	socket.on('remove_consumer', async (_, callback) => {
		try {
			mediaReceiverTransports.delete(socket.id);
			callback(true);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error('Server Error'),
			});
		}
	});

	handleRTPCapabilitiesRequests(socket);
	handleRTCTransportCreationRequests(socket);
	handleRTCTransportConnectionRequests(socket);
	handleSendTransportProducingRequests(socket);

	// TODO: super super slow
	const handler = createRTCResponseHandler<{
		layout: StageLayoutWithProducers;
		leftovers: Array<StageLayoutActorWithProducer>;
	}>('transport_receiver_consume', async () => {
		// Fail if no transport exists
		if (!mediaReceiverTransports.has(socket.id)) {
			throw new Error("Can't connect a non-existing receiver transport");
		}

		// Get transports for the connected socket
		const { options, transport } = mediaReceiverTransports.get(socket.id)!;

		// Create a record of what each participant is producing
		const participantProducers: Record<
			number,
			Array<{
				socketId: string;
				producerId: string;
				id: string;
				kind: MediaSoup.types.MediaKind;
				rtpParameters: MediaSoup.types.RtpParameters;
			}>
		> = {};

		// Create a list of consumers
		const consumers: Array<MediaSoup.types.Consumer> = [];

		// Find all active producers and group them by participant
		for (const [socketId, producer] of [
			...videoProducers.entries(),
			...audioProducers.entries(),
		]) {
			// Skip self consumption
			if (socket.id == socketId) {
				continue;
			}
			// Fail if unable to consume
			if (
				!(await mediaSoupRouter()).canConsume({
					producerId: producer.id,
					rtpCapabilities: options.rtpCapabilities,
				})
			) {
				throw new Error(
					'Can not consume from producer from socket ' + socketId
				);
			}
			const consumer = await transport.consume({
				producerId: producer.id,
				rtpCapabilities: options.rtpCapabilities,
				paused: true,
			});

			// Find the participant for the producing socket
			const participantId = onlineParticipants.get(socketId)!;

			// TODO: Check camera bans
			// TODO: Check microphone bans
			// TODO: Check visitor status

			// Update record keeping
			participantProducers[participantId] = [
				...(participantProducers[participantId] || []),
				{
					socketId: socket.id,
					producerId: producer.id,
					id: consumer.id,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
					//type: consumer.type,
					//producerPaused: consumer.producerPaused,
				},
			];
			consumers.push(consumer);
		}

		// Update receiver transport map
		mediaReceiverTransports.set(socket.id, {
			options,
			transport,
			consumers,
			producers: [],
		});

		// Find all actors
		const participants: Record<number, DataTypes['participant']> = (
			await client.participant.findMany({
				where: { actor: true },
			})
		).reduce((record, particpant) => {
			record[particpant.id] = particpant;
			return record;
		}, {});

		// Create a updated layout with producers
		const updatedLayout: StageLayoutWithProducers = stageLayout
			.get()
			.map((row) => {
				return row.map((cell) => {
					if (cell.type == 'actor') {
						if (!participants[cell.id]) {
							return {
								type: 'empty',
							};
						}
						const production = participantProducers[cell.id] || [];
						delete participantProducers[cell.id];
						return {
							type: 'actor',
							id: cell.id,
							participant: participants[cell.id],
							production,
						};
					} else {
						return cell;
					}
				});
			}) as any;

		// Find leftovers that are also producing
		const leftovers: Array<StageLayoutActorWithProducer> = Object.entries(
			participantProducers
		).map(([id, production]) => {
			return {
				type: 'actor',
				participant: participants[id],
				id,
				production,
			};
		}) as any; // TODO: easy to fix type error?

		return { layout: updatedLayout, leftovers };
	});
	handler(socket);

	socket.on('transport_receiver_resume', async (_, callback) => {
		try {
			// Fail if no transport exists
			if (!mediaReceiverTransports.has(socket.id)) {
				throw new Error("Can't resume a non-existing receiver transport");
			}
			const { consumers } = mediaReceiverTransports.get(socket.id)!;

			for (const consumer of consumers) {
				await consumer.resume();
			}
			callback(undefined);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error('Server Error'),
			});
		}
	});

	// Handle socket disconnections
	socket.on('disconnect', () => {
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
	socket.on('subscribe', async (message: SubscriptionMessage) => {
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
	socket.on('unsubscribe', async (message: SubscriptionMessage) => {
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
	Array<StageLayoutActorWithProducer | { type: 'chat' } | { type: 'empty' }>
>;

export type StageLayoutActorWithProducer = {
	type: 'actor';
	participant: DataTypes['participant'];
	id: number;
	production: Array<{
		socketId: string;
		producerId: string;
		id: string;
		kind: MediaSoup.types.MediaKind;
		rtpParameters: MediaSoup.types.RtpParameters;
	}>;
};
