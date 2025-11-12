import type { EffectData } from "../_types";
import Emittery from "emittery";
import { trpc } from "../lib";
import { z } from "zod";

/** Internal event emitter */
const _emitter = new Emittery<{ data: EffectData }>();

// Get the trcp router constructor and default procedure
const { router: trcpRouter, procedure: effectsProcedure } = trpc();

/**
 * Effects Router
 * Handles real-time effects like applause and flowers
 */
export const effectsRouter = trcpRouter({
	// Subscribe to effects stream
	effects: effectsProcedure.subscription(async function* () {
		yield null;

		for await (const data of _emitter.events("data")) {
			yield data;
		}
	}),

	// Send an effect
	send: effectsProcedure
		.input(
			z.object({
				type: z.enum(["flowers", "applause", "tomato"]),
				number: z.number(),
			}),
		)
		.mutation(({ input }) => {
			_emitter.emit("data", input);
		}),
});

/** Effects Router Definition */
export type EffectsRouter = typeof effectsRouter;
