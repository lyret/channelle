import type { ObservableValue } from '~/../server/api/observableValue';
import { readable } from 'svelte/store';
import { ws } from './lib';

/** Store interface */
type ObservableValueStore<V> = Pick<
	ObservableValue<V>,
	'key' | 'set' | 'subscribe'
> & {
	isConnected: () => boolean;
};

/** TODO: document */
export function createOVStore<V>(identifier: string): ObservableValueStore<V> {
	const _identifier = identifier;
	const _socket = ws(`/${identifier}`);
	let _connected = _socket.connected;

	let _onConnect = () => {
		_connected = true;
	};
	let _onDisconnect = () => {
		_connected = false;
	};

	const { subscribe } = readable<V>({} as V, function start(_set) {
		_socket.on('connect', _onConnect);
		_socket.on('disconnect', _onDisconnect);

		_socket.on('*', (data: V) => {
			_set(data);
		});

		_socket.emit('refresh');

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
