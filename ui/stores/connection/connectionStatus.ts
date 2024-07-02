import type { ConnectionStatusName } from '~/api';
import { RepositorySubscription } from '~/api';
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
			// Listen to any status updates from the websocket connection
			RepositorySubscription.subscriptionOn('status', handler);

			// Start a connection greedily when this store is subscribed to, which not done otherwise...
			RepositorySubscription.connect();

			return function stop() {
				RepositorySubscription.subscriptionOff('status', handler);
			};
		}
	);

	return {
		subscribe: subscribe,
	};
}

/** The current connection status to the API */
export const connectionStatus = createConnectionStore();
