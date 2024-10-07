import type { ObservableValueStore as ServerObservableValueStore } from '~/../server/lib/stores/createValueStore';
import { readable } from 'svelte/store';
import { ws } from './api';

/** Store interface */
type ObservableValueStore<V> = Pick<
	ServerObservableValueStore<V>,
	'key' | 'set' | 'subscribe'
> & {
	isConnected: () => boolean;
};

/** TODO: document */
export function createOVStore<V>(
	identifier: string,
	defaultValue: V | null = null
): ObservableValueStore<V> {
	const _identifier = identifier;
	const _socket = ws(`/${identifier}`);
	let _connected = _socket.connected;

	const { subscribe } = readable<V>(defaultValue as V, function start(_set) {
		let _onConnect = () => {
			_socket.emitWithAck('refresh').then((data) => {
				_connected = true;
				_set(data);
			});
		};
		let _onDisconnect = () => {
			_connected = false;
		};
		_socket.on('connect', _onConnect);
		_socket.on('disconnect', _onDisconnect);

		_socket.on('*', (data: V) => {
			_set(data);
		});

		return function stop() {
			_socket.off('connect', _onConnect);
			_socket.off('disconnect', _onDisconnect);
		};
	});

	return {
		key: _identifier,
		isConnected: () => _connected,
		set: (value: V) => {
			_socket.emit('set', value);
		},
		subscribe,
	};
}
