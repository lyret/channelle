import { createLocalSubscription } from "~/lib";
import { readable } from "svelte/store";

/** Store interface */
interface LocalStore<T> {
	subscribe: (subscription: (value: T) => void) => () => void;
	set: (value: T) => void;
	update: (updater: (value: T) => T) => void;
}

/** Creates a Svelte Store from a local subscription */
export function createLocalStore<T>(
	key: string,
	defaultValue: T
): LocalStore<T> {
	const subscription = createLocalSubscription<T>(key, defaultValue);

	const { subscribe } = readable(defaultValue, function start(set) {
		// Load any existing data
		set(subscription.get());

		subscription.onData((value) => {
			set(value);
		});

		subscription.start();

		return function stop() {
			subscription.stop();
		};
	});

	return {
		subscribe: subscribe,
		set: subscription.set.bind(subscription),
		update: (updater) =>
			subscription.set.bind(subscription)(updater(subscription.get())),
	};
}
