import { mediaRequest } from "~/lib";
import { readable } from "svelte/store";
import { triggerApplauseEffect, triggerFlowerGiftEffect } from "./_effectFunctions";
import { roomClient } from "~/api";

/** Store value */
type EffectsValue = { type: "flowers" | "applause"; number: number };

/** Store interface */
interface EffectsStore {
	// eslint-disable-next-line no-unused-vars
	subscribe: (subscription: (value: EffectsValue) => void) => () => void;
	// eslint-disable-next-line no-unused-vars
	set: (value: EffectsValue) => void;
}

/** Creates a Svelte Store for triggering effects from the server */
export function createEffectsStore(): EffectsStore {
	const { subscribe } = readable<EffectsValue>(undefined, function start(set) {
		// Handle status updates
		const handler = (value: EffectsValue) => {
			for (let i = 0; i < value.number; i++) {
				if (value.type == "flowers") {
					triggerFlowerGiftEffect();
				} else if (value.type == "applause") {
					triggerApplauseEffect();
				}
			}
			set(value);
		};

		// Listen to any effects updates from the websocket connection
		const { unsubscribe } = roomClient.effects.subscribe(undefined, {
			onData: (value) => {
				handler(value);
			},
		});

		return function stop() {
			unsubscribe();
		};
	});

	return {
		subscribe,
		set: (value: EffectsValue) => {
			setTimeout(() => {
				mediaRequest("effects_add", value);
			}, 100);
		},
	};
}
