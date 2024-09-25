import EventEmitter from 'node:events';
import { callWithoutDistruption } from './utils/callWithoutDistruption';
import { ws } from './lib';

/** Creates a new Observable Map */
export function observableMap<K extends string | number, V>(
	identifier: string
): ObservableMap<K, V> {
	const _identifier = identifier;
	const _map: Map<K, V> = new Map();
	const _io = ws().of(`/${identifier}`);
	const _emitter: EventEmitter<{ [P in keyof OMEvents<K, V>]: any }> =
		new EventEmitter();

	// Create a method for emitting the map when its updated
	const _emit = () => {
		const currentData = Object.fromEntries(_map.entries()) as Record<K, V>;
		_emitter.emit('*', currentData);
		_io.emit('*', currentData);
	};

	// Handle incomming web socket events from the client
	_io.on('connection', (_socket) => {
		_socket.on('set', ({ key, value }) => {
			_map.set(key, value);
			_emit();
		});
		_socket.on('delete', ({ key }) => {
			_map.delete(key);
			_emit();
		});
		_socket.on('clear', () => {
			_map.clear();
			_emit();
		});
		_socket.on('refresh', () => {
			const currentData = Object.fromEntries(_map.entries()) as Record<K, V>;
			console.log('HERE', currentData);
			_socket.emit('*', currentData);
		});
	});

	return {
		key: _identifier,
		set: (key: K, value: V) => {
			_map.set(key, value);
			_emit();
		},
		delete: (key: K) => {
			_map.delete(key);
			_emit();
		},
		clear: () => {
			_map.clear();
			_emit();
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
		iterable: () => {
			return _map.entries();
		},
		subscribe: (handler: (data: Record<K, V>) => any) => {
			_emitter.on('*', handler);
			callWithoutDistruption(handler)(
				Object.fromEntries(_map.entries()) as Record<K, V>
			);
			return () => {
				_emitter.off('*', handler);
			};
		},
	};
}

/** Observable Map */
export type ObservableMap<K extends string | number, V> = {
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
	iterable: () => IterableIterator<[K, V]>;
	/** Subscribe to updates to the map, retuns the unsubscibe function */
	subscribe: (handler: (data: Record<K, V>) => any) => () => void;
};

/** Events emitted within the observable map */
export type OMEvents<K extends string | number, V> = {
	'*': Record<K, V>;
};
