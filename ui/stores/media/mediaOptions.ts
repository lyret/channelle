import type { MediaOptions } from '~/api';
import { MediaSubscription } from '~/api';
import { readable } from 'svelte/store';

/** Store interface */
interface MediaOptionsStore<K extends keyof MediaOptions> {
	subscribe: (
		subscription: (value: MediaOptions[K] | undefined) => void
	) => () => void;
	set: (value: MediaOptions[K] | undefined) => void;
}

/** Creates a Svelte Store for tracking the given media option */
export function createMediaOptionStore<K extends keyof MediaOptions>(
	option: K
): MediaOptionsStore<K> {
	const { subscribe } = readable<MediaOptions[K] | undefined>(
		undefined,
		function start(set, update) {
			// Handle status updates
			const handler = (options: MediaOptions) => {
				set(options[option]);
			};

			// Listen to any status updates from the websocket connection
			MediaSubscription.connection().on('media_options_update', handler);

			// Request the complete
			MediaSubscription.getCurrentOptions().then((mediaOptions) => {
				set(mediaOptions[option]);
			});

			return function stop() {
				MediaSubscription.connection().off('media_options_update', handler);
			};
		}
	);

	return {
		subscribe,
		set: (value: MediaOptions[K] | undefined) => {
			setTimeout(() => {
				MediaSubscription.updateOption(option, value);
			}, 100);
		},
	};
}
