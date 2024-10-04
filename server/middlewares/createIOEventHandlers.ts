import {
	Repository,
	RepositoryOperations,
	RepositoryOperationsThatIntroducesChanges,
} from '../../database';
import * as IO from 'socket.io';
import {
	SubscriptionMessage,
	createSubscriptionPath,
} from '../../shared/subscriptions';
import { MediaRepository } from '../media';
import { userOnlineStatus } from '../stores/users';
import { scenePassword } from '../stores/access';

/** A map between online participants and connected sockets */
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

	socket.on('registerParticipant', async ({ id, password }) => {
		try {
			console.log(`[IO] ${socket.id} registered participant id ${id}`);
			console.log('HERE', id, password, scenePassword.get());

			if (password != scenePassword.get()) {
				return socket.emit('registerParticipant', { ok: false });
			}

			// Link to current media data status
			MediaRepository.Singelton.enterParticipant(socket.id, Number(id));

			onlineParticipants.set(socket.id, id);
			userOnlineStatus.set(id, true);

			socket.emit('registerParticipant', { ok: true });
		} catch {
			socket.emit('registerParticipant', { ok: false });
		}
	});

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
					userOnlineStatus.set(id, false);
				}
			} catch {}
		}

		// Remove media stream entries from this socket
		MediaRepository.Singelton.leaveParticipant(socket.id);

		console.log(`[IO] ${socket.id} left...`);
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

	// Add media repository operations
	for (const [type, handler] of Object.entries(
		MediaRepository.Singelton.requestHandlers()
	)) {
		socket.on(type, async (data: any, callback) => {
			try {
				// Get any participant registered for the requesting socket
				// if (onlineParticipants.has(socket.id)) {
				// 	const participantId = onlineParticipants.get(socket.id);
				//
				// }

				const response = await handler({ data, socket });
				console.log(`[MEDIA] Request ${type} returning:`, response);
				callback(response);
			} catch (err) {
				console.error('[MEDIA] error responding to', type);
				console.error(err);
				callback({
					error: CONFIG.isProduction ? err : new Error('Server Error'),
				});
			}
		});
	}
};
