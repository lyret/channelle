import { mediaRequest } from "~/lib";
import { readable } from "svelte/store";
import { triggerApplauseEffect, triggerFlowerGiftEffect } from "./effects";
import { ws } from "~/lib/api";

/** Store value */
type EffectsValue = { type: "flowers" | "applause"; number: number };

/** Store interface */
interface EffectsStore {
	subscribe: (subscription: (value: EffectsValue) => void) => () => void;
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

		// Listen to any status updates from the websocket connection
		ws().on("effects_trigger", handler);

		return function stop() {
			ws().off("effects_trigger", handler);
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
