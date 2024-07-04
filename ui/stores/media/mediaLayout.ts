import type { MediaLayout } from '~/api';
import { MediaSubscription } from '~/api';
import { readable } from 'svelte/store';

/** Store interface */
interface MediaLayoutStore {
	subscribe: (subscription: (value: MediaLayout) => void) => () => void;
	set: (value: MediaLayout) => void;
}

/** Creates a Svelte Store for tracking the current media layout */
export function createMediaLayoutStore(): MediaLayoutStore {
	const defaultValue: MediaLayout = { layout: [] };

	const { subscribe } = readable<MediaLayout>(
		defaultValue,
		function start(set) {
			// Handle status updates
			const handler = (value: MediaLayout) => {
				set(value);
			};

			// Listen to any status updates from the websocket connection
			MediaSubscription.connection().on('media_layout_update', handler);

			// Request the latest update once
			MediaSubscription.layout(undefined).then((layout) => {
				set(layout);
			});

			return function stop() {
				MediaSubscription.connection().off('media_layout_update', handler);
			};
		}
	);

	return {
		subscribe,
		set: (value: MediaLayout) => MediaSubscription.layout(value),
	};
}
