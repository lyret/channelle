import type { EffectData } from "~/types/serverSideTypes";
import { effectsClient } from "../_trpcClient";

/**
 * Send an effect to all connected clients
 */
export async function sendEffect(data: EffectData) {
	return effectsClient.send.mutate(data);
}

/**
 * Subscribe to effects stream
 */
export function subscribeToEffects(onEffect: (data: EffectData | null) => void) {
	return effectsClient.effects.subscribe(undefined, {
		onData: onEffect,
		onError: (err) => console.error("Effects subscription error:", err),
	});
}
