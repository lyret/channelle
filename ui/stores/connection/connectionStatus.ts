import type { ConnectionStatusName } from '~/api';
import { Subscription } from '~/api';
import { readable } from 'svelte/store';

/** Store interface */
interface ConnectionStore {
	subscribe: (
		subscription: (value: ConnectionStatusName) => void
	) => () => void;
}

/** Creates a Svelte Store for tracking the connection to the API */
function createConnectionStore(): ConnectionStore {
	const defaultValue: ConnectionStatusName = 'disconnected';

	const { subscribe } = readable<ConnectionStatusName>(
		defaultValue,
		function start(set) {
			// Handle status updates
			const handler = (value: ConnectionStatusName) => {
				set(value);
			};
			Subscription._eventEmitter.on('status', handler);

			// NOTE: this starts a connection greedely, which not done otherwise...
			Subscription.connect();

			return function stop() {
				Subscription._eventEmitter.off('status', handler);
			};
		}
	);

	return {
		subscribe: subscribe,
	};
}

/** The current connection status to the API */
export const connectionStatus = createConnectionStore();
