import type { SubscriptionMediaEvents } from '~/api';
import { MediaSubscription } from '~/api';
import { readable } from 'svelte/store';

/** Store Interface */
interface MediaStore<Key extends keyof SubscriptionMediaEvents> {
	subscribe: (
		subscription: (value: SubscriptionMediaEvents[Key]) => void
	) => () => void;
	publishVideo: typeof MediaSubscription.publishVideo;
	stopPublishVideo: typeof MediaSubscription.stopPublishVideo;
	publishAudio: typeof MediaSubscription.publishAudio;
	stopPublishAudio: typeof MediaSubscription.stopPublishAudio;
	consume: typeof MediaSubscription.consume;
	stopConsume: typeof MediaSubscription.stopConsume;
}

/** Creates a readable Svelte Store for listening to events and data from the media api */
export function createMediaStore<Key extends keyof SubscriptionMediaEvents>(
	key: Key
): MediaStore<Key> {
	const { subscribe } = readable(
		MediaSubscription.mediaGet(key),
		function start(set) {
			// Load any existing data
			set(MediaSubscription.mediaGet(key));

			// Start the subscription
			MediaSubscription.mediaOn(key, (value) => {
				set(value);
			});
			if (key == 'remoteMediaStreams') {
				console.log('CONSUME');
				MediaSubscription.consume();
			}

			return function stop() {
				if (key == 'remoteMediaStreams') {
					MediaSubscription.stopConsume();
					// TODO: should decrese nr of listeners here instead
				}
			};
		}
	);

	return {
		subscribe: subscribe,
		publishVideo: MediaSubscription.publishVideo.bind(MediaSubscription),
		publishAudio: MediaSubscription.publishAudio.bind(MediaSubscription),
		stopPublishVideo:
			MediaSubscription.stopPublishVideo.bind(MediaSubscription),
		stopPublishAudio:
			MediaSubscription.stopPublishAudio.bind(MediaSubscription),
		consume: MediaSubscription.consume.bind(MediaSubscription),
		stopConsume: MediaSubscription.stopConsume.bind(MediaSubscription),
	};
}
