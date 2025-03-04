import type { ObservableMapStore as ServerObservableMapStore } from '~/../server/lib/stores/createMapStore';
import { readable } from 'svelte/store';
import { ws } from '../api';

/** Store interface */
type RemoteMapStore<K extends string | number, V> = Pick<
	ServerObservableMapStore<K, V>,
	'key' | 'set' | 'delete' | 'clear' | 'subscribe'
> & {
	isConnected: () => boolean;
};

/** Creates a Svelte Store for an remote observable map on the server side */
export function createRemoteMapStore<K extends string | number, V>(
	identifier: string
): RemoteMapStore<K, V> {
	const _identifier = identifier;
	const _socket = ws(`/${identifier}`);

	const { subscribe } = readable<Record<K, V>>(
		{} as Record<K, V>,
		function start(_set) {
			// Refresh the current remote value
			_socket.emit('refresh', (data: Record<K, V>) => {
				_set(data);
			});

			const _onConnect = () => {};
			_socket.on('connect', _onConnect);

			const _onDisconnect = () => {};
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
		isConnected: () => _socket.connected,
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
