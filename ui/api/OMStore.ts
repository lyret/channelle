import type { ObservableMap, OMEvents } from '~/../server/api/observableMap';
import Emittery from 'emittery';
import { readable } from 'svelte/store';
import { ws } from './lib';

/** Store interface */
type ObservableMapStore<K extends string | number, V> = Pick<
	ObservableMap<K, V>,
	'key' | 'set' | 'delete' | 'clear' | 'subscribe'
> & {
	isConnected: () => boolean;
};

/** Creates a Svelte Store from a local subscription */
export function createOMStore<K extends string | number, V>(
	identifier: string
): ObservableMapStore<K, V> {
	const _identifier = identifier;
	const _socket = ws(`/${identifier}`);
	let _connected = _socket.connected;

	let _onConnect = () => {
		_connected = true;
	};
	let _onDisconnect = () => {
		_connected = false;
	};

	const { subscribe } = readable<Record<K, V>>(
		{} as Record<K, V>,
		function start(_set) {
			_socket.on('connect', _onConnect);
			_socket.on('disconnect', _onDisconnect);

			_socket.on('*', (data: Record<K, V>) => {
				_set(data);
			});

			return function stop() {
				_socket.off('connect', _onConnect);
				_socket.off('disconnect', _onDisconnect);
			};
		}
	);

	return {
		key: _identifier,
		isConnected: () => _connected,
		set: (key: K, value: V) => {
			_socket.emit('set', { key, value });
		},
		delete: (key: K) => {
			_socket.emit('delete', { key });
		},
		clear: () => {
			_socket.emit('clear', {});
		},
		subscribe,
	};
}
