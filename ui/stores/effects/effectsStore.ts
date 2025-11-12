import type { EffectData } from "~/types/serverSideTypes";
import { readable } from "svelte/store";
import { triggerApplauseEffect, triggerFlowerGiftEffect, triggerTomatoEffect } from "./_effectFunctions";
import { sendEffect, subscribeToEffects } from "~/api/effects";

/** Store interface */
interface EffectsStore {
	// eslint-disable-next-line no-unused-vars
	subscribe: (subscription: (value: EffectData) => void) => () => void;
	// eslint-disable-next-line no-unused-vars
	set: (value: EffectData) => void;
}

/** Creates a Svelte Store for triggering effects from the server */
export function createEffectsStore(): EffectsStore {
	const { subscribe } = readable<EffectData>(undefined, function start(set) {
		// Handle status updates
		const handler = (value: EffectData | null) => {
			if (!value) {
				return;
			}
			for (let i = 0; i < value.number; i++) {
				if (value.type == "flowers") {
					triggerFlowerGiftEffect();
				} else if (value.type == "applause") {
					triggerApplauseEffect();
				} else if (value.type == "tomato") {
					triggerTomatoEffect();
				}
			}
			set(value);
		};

		// Listen to any effects updates from the websocket connection
		const { unsubscribe } = subscribeToEffects(handler);

		return function stop() {
			unsubscribe();
		};
	});

	return {
		subscribe,
		set: async (value: EffectData) => {
			await sendEffect(value);
		},
	};
}
