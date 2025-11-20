import type { BackstageConfiguration, EditableShowAttributes, Scene } from "../_types";
import Emittery from "emittery";
import { TRPCError } from "@trpc/server";
import { SceneSetting } from "../_types";
import { Show } from "../models/Show";
import { z } from "zod";
import { trpc } from "../lib";
import { authenticateAdminMiddleware } from "./authRouter";
import { getGlobalBackstageConfiguration, saveBackstageConfiguration, toBackstageConfiguration } from "../_globalBackstageData";
import { retrivePeerDetailsMiddleware } from "./userRouter";

// Internal event emitter for message updates
const _updateEmitter = new Emittery<{
	[id: number]: BackstageConfiguration;
}>();

// Validation schema for EditableShowAttributes
const _editableShowAttributesSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string(),
	nomenclature: z.string().min(1).max(100),
	script: z.any().optional(),
	password: z.string(),
	selectedScene: z.custom<Scene | null>(),
	curtainsOverride: z.enum(SceneSetting),
	chatEnabledOverride: z.enum(SceneSetting),
	gratitudeEffectsEnabledOverride: z.enum(SceneSetting),
	criticalEffectsEnabledOverride: z.enum(SceneSetting),
	visitorAudioEnabledOverride: z.enum(SceneSetting),
	visitorVideoEnabledOverride: z.enum(SceneSetting),
	nrOfTimesRehersed: z.number().int().min(0),
	nrOfTimesShown: z.number().int().min(0),
}) satisfies z.ZodType<EditableShowAttributes>;

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure } = trpc();

/**
 * Procedure that validates the a configuration is selected and add it to the context
 */
export const withConfigProcedure = procedure
	.input(
		z
			.object({
				showId: z.number().int().gte(0).optional(),
			})
			.optional(),
	)
	.use(async ({ input, ctx, next }) => {
		// In stage mode the global configuration is used
		if (!CONFIG.runtime.theater) {
			return next({ ctx: { ...ctx, config: getGlobalBackstageConfiguration() } });
		}

		try {
			if (input?.showId) {
				const show = await Show.findByPk(input.showId);
				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Selected show not found",
					});
				}
				return next({ ctx: { ...ctx, config: toBackstageConfiguration(show) } });
			} else {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No selected show given",
				});
			}
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}
			console.error("[Backstage] Error selecting show:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to select show from given input",
			});
		}
	});

/**
 * Procedure that validates that the selected show can be edited
 */
const editConfigProcedure = withConfigProcedure
	.use(retrivePeerDetailsMiddleware)
	.use(authenticateAdminMiddleware)
	.use(async ({ ctx, next }) => {
		try {
			if (!ctx.config.isEditable) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Show is not configurable",
				});
			}

			// Tries to edit the backstage configuration
			const results = await next({ ctx });

			// Triess to persist the selected edits to the show in the database
			await saveBackstageConfiguration(ctx.config);
			_updateEmitter.emit(ctx.config.showId || 0, ctx.config);

			// Return the results of the editing procedure
			return results;
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}
			console.error("[Backstage] Error editing configuration:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to edit the backstage configuration",
			});
		}
	});

/**
 * Configuration Router - Unified stage configuration management
 * Handles all stage configuration including scenes, settings, passwords, and show metadata
 */
export const backstageRouter = trcpRouter({
	/** Subscription for backstage configuration per show id (global in stage mode) with automatic updates */
	configuration: withConfigProcedure.subscription(async function* ({ ctx: { config, peer } }) {
		console.log(`[Backstage] Client ${peer.id} subscribed to configuration: ${config.name}`);

		yield {
			type: "inital",
			config: config,
		};

		for await (const update of _updateEmitter.events(config.showId || 0)) {
			yield {
				type: "update",
				config: update,
			};
		}
	}),

	/** Updates one or more properties of the configuration */
	updateProperties: editConfigProcedure
		.input(z.object({ update: _editableShowAttributesSchema.partial() }))
		.mutation(async ({ input: { update }, ctx: { config } }) => {
			// Check for name conflicts
			if (CONFIG.runtime.theater && update.name && update.name !== config.name) {
				const nrOfExistingShowsWithName = await Show.count({
					where: { name: update.name },
				});
				if (nrOfExistingShowsWithName) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A show with this name already exists",
					});
				}
			}

			// Update properties
			for (const [key, value] of Object.entries(update)) {
				if (value !== config[key]) {
					config[key] = value;
				}
			}
		}),

	/** Reset all overrididen settings to automatic */
	automateOverridenSettings: editConfigProcedure.mutation(async ({ ctx: { config } }) => {
		// Reset runtime settings
		config.curtainsOverride = SceneSetting.AUTOMATIC;
		config.chatEnabledOverride = SceneSetting.AUTOMATIC;
		config.visitorAudioEnabledOverride = SceneSetting.AUTOMATIC;
		config.visitorVideoEnabledOverride = SceneSetting.AUTOMATIC;
		config.gratitudeEffectsEnabledOverride = SceneSetting.AUTOMATIC;
		config.criticalEffectsEnabledOverride = SceneSetting.AUTOMATIC;
	}),
});

/** Configuration Router Type */
export type BackstageRouter = typeof backstageRouter;
