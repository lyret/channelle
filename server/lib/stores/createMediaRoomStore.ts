import type * as MediaSoup from 'mediasoup';
import EventEmitter from 'node:events';
import { attempt } from '../utils/attempt';
import { mediaSoupRouter, ws } from '../api';
import { createRTCResponseHandler } from '../rtc';

/** TODO: Creates a new observable store for a map of values */
export function createMediaRoomStore(identifier: string): MediaRoomStore {
	const _identifier = identifier;
	const _io = ws().of(`/${identifier}`);
	const _emitter: EventEmitter = new EventEmitter();

	// A map between connected sockets and participant ids for that socket
	// @type: { [SocketId] : ParticipationId }
	const _connectedParticipants = new Map<string, number>();

	// Keep a consumer transport for each connected client device
	// @type: { [SocketId] : WebRTCTransport }
	const _consumerTransports = new Map<
		string,
		{
			options: {
				forceTcp: false;
				rtpCapabilities: MediaSoup.types.RtpCapabilities;
			};
			transport: MediaSoup.types.WebRtcTransport;
			consumers: Array<MediaSoup.types.Consumer>;
		}
	>();

	// Create a method for emitting when the
	const _emit = () => {
		// const currentData = Object.fromEntries(_map.entries()) as Record<K, V>;
		// _emitter.emit('*', currentData);
		// _io.emit('*', currentData);
		_io.emit('producers');
	};

	// Handle incomming web socket events from the client
	_io.on('connection', (socket) => {
		createRTCResponseHandler(
			socket,
			'transport_receiver_consume',
			async ({}) => {
				// Fail if no transport exists
				if (!_consumerTransports.has(socket.id)) {
					throw new Error("Can't connect a non-existing receiver transport");
				}
				// Get the consumer transport for the socket connection
				const { options, transport } = _consumerTransports.get(socket.id)!;

				const results: Res['consumers'] = [];
				const consumers: Array<MediaSoup.types.Consumer> = [];

				// FIXME:
				for (const [socketId, producer] of [
					...videoProducers.entries(),
					...audioProducers.entries(),
				]) {
					// Skip self consumption
					// if (_socket.id == socketId) {
					// 	continue;
					// }
					// Fail if unable to consume
					if (
						!(await mediaSoupRouter()).canConsume({
							producerId: producer.id,
							rtpCapabilities: options.rtpCapabilities,
						})
					) {
						throw new Error(
							'Failed to consume from the producing device at socket ' +
								socketId
						);
					}
					const consumer = await transport.consume({
						producerId: producer.id,
						rtpCapabilities: options.rtpCapabilities,
						paused: true,
					});

					results.push({
						socketId: socket.id,
						producerId: producer.id,
						id: consumer.id,
						kind: consumer.kind,
						rtpParameters: consumer.rtpParameters,
						participantId: _connectedParticipants.get(socketId)!,
					});
					consumers.push(consumer);
				}

				// Save and return consumers
				mediaReceiverTransports.set(socket.id, {
					options,
					transport,
					consumers,
				});

				return { consumers: results };
			}
		);

		socket.on('set', ({ key, value }) => {
			_map.set(key, value);
			_update_producers();
		});
		socket.on('delete', ({ key }) => {
			if (!_map.has(key)) {
				return;
			}
			if (middlewares.onDelete) {
				middlewares.onDelete(_map.get(key)!);
			}
			_map.delete(key);
			_update_producers();
		});
		socket.on('clear', () => {
			if (!_map.size) {
				return;
			}
			if (middlewares.onDelete) {
				_map.forEach(middlewares.onDelete);
			}
			_map.clear();
			_update_producers();
		});
		socket.on('refresh', (callback) => {
			const currentData = Object.fromEntries(_map.entries()) as Record<K, V>;
			callback(currentData);
		});
	});

	return {
		key: _identifier,
		set: (key: K, value: V) => {
			_map.set(key, value);
			_update_producers();
		},
		delete: (key: K) => {
			if (!_map.has(key)) {
				return;
			}
			if (middlewares.onDelete) {
				middlewares.onDelete(_map.get(key)!);
			}
			_map.delete(key);
			_update_producers();
		},
		clear: () => {
			if (!_map.size) {
				return;
			}
			if (middlewares.onDelete) {
				_map.forEach(middlewares.onDelete);
			}
			_map.clear();
			_update_producers();
		},
		has: (key: K) => {
			return _map.has(key);
		},
		get: (key: K) => {
			return _map.get(key);
		},
		map: () => {
			return _map;
		},
		entries: () => {
			return _map.entries();
		},
		subscribe: (handler: (data: Record<K, V>) => any) => {
			_emitter.on('*', handler);
			attempt(handler)(Object.fromEntries(_map.entries()) as Record<K, V>);
			return () => {
				_emitter.off('*', handler);
			};
		},
	};
}

/** TODO: Observable Map Store Interface */
export type MediaRoomStore = {
	/** Returns the key for this observable map, unique for server<->client communication */
	key: string;
	/** Sets a key in the map to the given value */
	set: (key: K, value: V) => void;
	/** Removes a single value from the map */
	delete: (key: K) => void;
	/** Removes all values of the map */
	clear: () => void;
	/** Returns true if a key exists in the map */
	has: (key: K) => boolean;
	/** Returns a single value directly from the map */
	get: (key: K) => V | undefined;
	/** Returns the underlying map object directly */
	map: () => Map<K, V>;
	/** Returns an iterable iterator for each key value pair in the map */
	entries: () => IterableIterator<[K, V]>;
	/** Subscribe to updates to the map, retuns the unsubscibe function */
	subscribe: (handler: (data: Record<K, V>) => any) => () => void;
};

/** TODO: Events emitted within the observable map store */
export type OMEvents<K extends string | number, V> = {
	'*': Record<K, V>;
};

// TODO:
type Res = {
	consumers: Array<{
		socketId: string;
		producerId: string;
		id: string;
		kind: MediaSoup.types.MediaKind;
		rtpParameters: MediaSoup.types.RtpParameters;
		participantId: number;
	}>;
};
