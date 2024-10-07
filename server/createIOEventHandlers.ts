import type * as MediaSoup from 'mediasoup';
import * as IO from 'socket.io';
import {
	client,
	Repository,
	RepositoryOperations,
	RepositoryOperationsThatIntroducesChanges,
} from '../database';
import {
	MediaRequests,
	SubscriptionMessage,
	createSubscriptionPath,
} from '../shared/subscriptions';

import { createWebRTCTransport } from './lib/rtc';
import { mediaSoupRouter, ws } from './lib/api';

import { userOnlineStatus } from './stores/users';
import { scenePassword } from './stores/scene';
console.log(scenePassword);
import {
	mediaProducerTransports,
	mediaReceiverTransports,
	videoProducers,
	audioProducers,
} from './stores/media';

// FIXME: test
videoProducers.subscribe((data) => {
	console.log('NOW', data);
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

	socket.on('registerParticipant', async (id, callback) => {
		try {
			const participant = await (!id || Number.isNaN(id)
				? client.participant.create({
						data: {
							name: '',
							manager: (await client.participant.count()) == 0,
						},
					})
				: client.participant.findFirst({
						where: { id },
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
		} catch {
			console.error('HERE');
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
	socket.on('server_rtp_capabilities', async (_, callback) => {
		try {
			callback((await mediaSoupRouter()).rtpCapabilities);
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error('Server Error'),
			});
		}
	});
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
	socket.on(
		'transport_producer_create',
		async (
			data: {
				forceTcp: Boolean;
				rtpCapabilities: MediaSoup.types.RtpCapabilities;
			},
			callback
		) => {
			try {
				const { transport, params } = await createWebRTCTransport();
				mediaProducerTransports.set(socket.id, transport);
				callback(params);
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		}
	);
	socket.on(
		'transport_producer_connect',
		async (
			data: { dtlsParameters: MediaSoup.types.DtlsParameters },
			callback
		) => {
			try {
				if (!mediaProducerTransports.has(socket.id)) {
					throw new Error("Can't connect non-existing producer transport");
				}
				await mediaProducerTransports.get(socket.id)!.connect({
					dtlsParameters: data.dtlsParameters,
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
		'transport_producer_produce',
		async (
			data: {
				transportId: string;
				kind: MediaSoup.types.MediaKind;
				rtpParameters: MediaSoup.types.RtpParameters;
			},
			callback
		) => {
			try {
				const { kind, rtpParameters } = data;
				if (!mediaProducerTransports.has(socket.id)) {
					throw new Error("Can't produce from non-existing producer transport");
				}

				const producer = await mediaProducerTransports.get(socket.id)!.produce({
					kind,
					rtpParameters,
				});

				if (producer.kind == 'audio') {
					// Close previous producer
					audioProducers.delete(socket.id);
					// Update audio producer collection
					audioProducers.set(socket.id, producer);
				} else {
					// Close previous producer
					videoProducers.delete(socket.id);
					// Update video producer collection
					videoProducers.set(socket.id, producer);
				}
				callback({ id: producer.id });
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		}
	);
	socket.on(
		'transport_receiver_create',
		async (
			data: {
				forceTcp: false;
				rtpCapabilities: MediaSoup.types.RtpCapabilities;
			},
			callback
		) => {
			try {
				// Destroy previous transport if it exists
				mediaReceiverTransports.delete(socket.id);

				// Create a new transport
				const { transport, params } = await createWebRTCTransport();
				mediaReceiverTransports.set(socket.id, {
					options: data,
					transport: transport,
					consumers: [],
				});

				// Return parameters
				callback(params);
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		}
	);
	socket.on(
		'transport_receiver_connect',
		async (
			data: {
				transportId: string;
				dtlsParameters: MediaSoup.types.DtlsParameters;
			},
			callback
		) => {
			try {
				// Fail if no transport exists
				if (!mediaReceiverTransports.has(socket.id)) {
					throw new Error("Can't connect a non-existing receiver transport");
				}

				// Connect it
				const { transport } = mediaReceiverTransports.get(socket.id)!;
				console.log('transport_receiver_connect', socket.id);
				await transport.connect({
					dtlsParameters: data.dtlsParameters,
				});

				// Return
				callback(undefined);
			} catch (err) {
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		}
	);
	socket.on('transport_receiver_consume', async (_, callback) => {
		try {
			// Fail if no transport exists
			if (!mediaReceiverTransports.has(socket.id)) {
				throw new Error("Can't connect a non-existing receiver transport");
			}
			const { options, transport } = mediaReceiverTransports.get(socket.id)!;
			const results: MediaRequests['transport_receiver_consume'][1]['consumers'] =
				[];
			const consumers: Array<MediaSoup.types.Consumer> = [];

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
				// TODO: re-enable simulcast
				// if (consumer.type === "simulcast") {
				// 	await consumer.setPreferredLayers({
				// 		spatialLayer: 2,
				// 		temporalLayer: 2,
				// 	});
				// }

				results.push({
					socketId: socket.id,
					producerId: producer.id,
					id: consumer.id,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
					participantId: onlineParticipants.get(socketId)!,
					//type: consumer.type,
					//producerPaused: consumer.producerPaused,
				});
				consumers.push(consumer);
			}

			// Save and return consumers
			mediaReceiverTransports.set(socket.id, {
				options,
				transport,
				consumers,
			});

			callback({ consumers: results });
		} catch (err) {
			console.error(err);
			callback({
				error: CONFIG.isProduction ? err : new Error('Server Error'),
			});
		}
	});
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
