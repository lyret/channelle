import type { ObservableValueStore as ServerObservableValueStore } from '~/../server/lib/stores/createValueStore';
import { readable } from 'svelte/store';
import { ws } from '../api';

/** Store interface */
type RemoteValueStore<V> = Pick<
	ServerObservableValueStore<V>,
	'key' | 'set' | 'subscribe'
> & {
	isConnected: () => boolean;
};

/** Creates a Svelte Store for an remote observable value on the server side */
export function createRemoteValueStore<V>(
	identifier: string,
	defaultValue: V | null = null
): RemoteValueStore<V> {
	const _identifier = identifier;
	const _socket = ws(`/${identifier}`);

	const { subscribe } = readable<V>(defaultValue as V, function start(_set) {
		// Refresh the current remote value
		_socket.emit('refresh', (data: V) => {
			_set(data);
		});
		let _onConnect = () => {};
		_socket.on('connect', _onConnect);

		let _onDisconnect = () => {};
		_socket.on('disconnect', _onDisconnect);

		_socket.on('*', (data: V) => {
			console.log('VAL', '*', data);
			_set(data);
		});

		return function stop() {
			_socket.off('connect', _onConnect);
			_socket.off('disconnect', _onDisconnect);
		};
	});

	return {
		key: _identifier,
		isConnected: () => _socket.connected,
		set: (value: V) => {
			_socket.emit('set', value);
		},
		subscribe,
	};
}
