import { TRPCError } from "@trpc/server";
import type { Scene } from "../_types";
import { SceneSetting } from "../_types";
import { Show } from "../models/Show";
import { z } from "zod";
import { trpc } from "../lib";
import { adminUserProcedure } from "./authRouter";
import { getGlobalBackstageConfiguration, toBackstageConfiguration } from "../_globalBackstageData";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Procedure that validates the a show is selected and add it to the context
 */
const selectedShowProcedure = adminUserProcedure
	.input(
		z.object({
			showId: z.number().int().positive().optional(),
		}),
	)
	.use(async ({ input: { showId }, ctx, next }) => {
		// In stage mode the global configuration is used
		if (!CONFIG.runtime.theater) {
			return next({ ctx: { ...ctx, config: getGlobalBackstageConfiguration() } });
		}

		try {
			if (showId) {
				const show = await Show.findByPk(showId);
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
			console.error("[Config] Error selecting show:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to select show from given input",
			});
		}
	});

/**
 * Procedure that validates that the selected show can be edited
 */
const editableShowProcedure = selectedShowProcedure.use(({ ctx, next }) => {
	// In stage mode the configuration is always editable
	if (!CONFIG.runtime.theater) {
		return next({ ctx });
	}

	if (!ctx.config.isEditable) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Show is not editable right now",
		});
	}
	return next({ ctx });
});

/**
 * Configuration Router - Unified stage configuration management
 * Handles all stage configuration including scenes, settings, passwords, and show metadata
 */
export const backstageRouter = trcpRouter({
	/**
	 * Get Stage Configuration - Complete unified view of stage configuration
	 * Combines runtime state with persistent show data when available
	 */
	getConfig: trcpProcedure.query(async () => {
		// Get runtime scene configuration
		const currentScene =
			(_backstageConfiguration.currentScene && {
				name: _backstageConfiguration.currentScene.name,
				layout: _backstageConfiguration.currentScene.layout,
				curtains: _determineStateOfSetting("curtains"),
				chatEnabled: _determineStateOfSetting("chatEnabled"),
				gratitudeEffectsEnabled: _determineStateOfSetting("gratitudeEffectsEnabled"),
				criticalEffectsEnabled: _determineStateOfSetting("criticalEffectsEnabled"),
				visitorAudioEnabled: _determineStateOfSetting("visitorAudioEnabled"),
				visitorVideoEnabled: _determineStateOfSetting("visitorVideoEnabled"),
			}) ||
			undefined;

		// Get show metadata if a show is selected
		let showMetadata: PublicShowData | null = null; // FIXME: 222
		if (_backstageConfiguration.selectedShowId) {
			try {
				const show = await Show.findByPk(_backstageConfiguration.selectedShowId);
				if (show) {
					showMetadata = {
						id: show.id,
						name: show.name,
						description: show.description,
						nomenclature: show.nomenclature,
						isPasswordProtected: Boolean(show.showPassword && show.showPassword.trim() !== ""),
						curtainsOverride: show.curtainsOverride,
						chatEnabledOverride: show.chatEnabledOverride,
						gratitudeEffectsEnabledOverride: show.gratitudeEffectsEnabledOverride,
						criticalEffectsEnabledOverride: show.criticalEffectsEnabledOverride,
						visitorAudioEnabledOverride: show.visitorAudioEnabledOverride,
						visitorVideoEnabledOverride: show.visitorVideoEnabledOverride,
						currentScene: show.currentScene,
						lastOnlineAt: show.lastOnlineAt,
						createdAt: show.createdAt,
						updatedAt: show.updatedAt,
					};
				}
			} catch (error) {
				console.error("[Config] Error fetching show metadata:", error);
			}
		}

		return {
			// Runtime configuration
			password: _backstageConfiguration.password,
			sceneSettings: _backstageConfiguration.sceneSettings,
			currentScene,
			// Show metadata (if available)
			selectedShowId: _backstageConfiguration.selectedShowId,
			showMetadata,
		};
	}),

	/**
	 * Set Password - Unified password management
	 * Sets runtime password and optionally persists to show if one is selected
	 * @requires Manager role
	 */
	setPassword: editableShowProcedure
		.input(
			z.object({
				password: z.string().optional(),
				persistToShow: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input: { password, persistToShow } }) => {
			// Set runtime password
			_backstageConfiguration.password = password;

			// Optionally persist to selected show
			if (persistToShow && _backstageConfiguration.selectedShowId) {
				try {
					const show = await Show.findByPk(_backstageConfiguration.selectedShowId);
					if (show) {
						await show.update({ showPassword: password || "" });
						console.log(`[Config] Password persisted to show: ${show.name} (ID: ${show.id})`);
					}
				} catch (error) {
					console.error("[Config] Error persisting password to show:", error);
					// Don't throw - runtime password was set successfully
				}
			}

			return { success: true };
		}),

	/**
	 * Set Scene Setting Override - Unified setting override management
	 * Sets runtime overrides and optionally persists to show if one is selected
	 * @requires Manager role
	 */
	setSetting: editableShowProcedure
		.input(
			z.object({
				key: z.enum(["curtains", "chatEnabled", "gratitudeEffectsEnabled", "criticalEffectsEnabled", "visitorAudioEnabled", "visitorVideoEnabled"]),
				value: z.nativeEnum(SceneSetting),
				persistToShow: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input: { key, value, persistToShow } }) => {
			// Set runtime override
			_backstageConfiguration.sceneSettings[key] = value;

			// Optionally persist to selected show
			if (persistToShow && _backstageConfiguration.selectedShowId) {
				try {
					const show = await Show.findByPk(_backstageConfiguration.selectedShowId);
					if (show) {
						const fieldMap = {
							curtains: "curtainsOverride",
							chatEnabled: "chatEnabledOverride",
							gratitudeEffectsEnabled: "gratitudeEffectsEnabledOverride",
							criticalEffectsEnabled: "criticalEffectsEnabledOverride",
							visitorAudioEnabled: "visitorAudioEnabledOverride",
							visitorVideoEnabled: "visitorVideoEnabledOverride",
						};

						const fieldName = fieldMap[key];
						await show.update({ [fieldName]: value });
						console.log(`[Config] Setting ${key} persisted to show: ${show.name} (ID: ${show.id})`);
					}
				} catch (error) {
					console.error("[Config] Error persisting setting to show:", error);
					// Don't throw - runtime setting was set successfully
				}
			}

			return { success: true };
		}),

	/**
	 * Set Current Scene - Unified scene management
	 * Sets runtime scene and optionally persists to show if one is selected
	 * @requires Manager role
	 */
	setScene: editableShowProcedure
		.input(
			z.object({
				scene: z.custom<Scene>().nullable(),
				persistToShow: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input: { scene, persistToShow } }) => {
			// Set runtime scene
			_backstageConfiguration.currentScene = scene || undefined;

			// Optionally persist to selected show
			if (persistToShow && _backstageConfiguration.selectedShowId) {
				try {
					const show = await Show.findByPk(_backstageConfiguration.selectedShowId);
					if (show) {
						await show.update({ currentScene: scene });
						console.log(`[Config] Scene "${scene?.name || "null"}" persisted to show: ${show.name} (ID: ${show.id})`);
					}
				} catch (error) {
					console.error("[Config] Error persisting scene to show:", error);
					// Don't throw - runtime scene was set successfully
				}
			}

			return { success: true };
		}),

	/**
	 * Reset Settings - Reset all overrides to automatic
	 * @requires Manager role
	 */
	resetSettings: editableShowProcedure.input(z.object({ persistToShow: z.boolean().default(false) })).mutation(async ({ input: { persistToShow } }) => {
		// Reset runtime settings
		_backstageConfiguration.sceneSettings = {
			curtains: SceneSetting.AUTOMATIC,
			chatEnabled: SceneSetting.AUTOMATIC,
			gratitudeEffectsEnabled: SceneSetting.AUTOMATIC,
			criticalEffectsEnabled: SceneSetting.AUTOMATIC,
			visitorAudioEnabled: SceneSetting.AUTOMATIC,
			visitorVideoEnabled: SceneSetting.AUTOMATIC,
		};

		// Optionally persist to selected show
		if (persistToShow && _backstageConfiguration.selectedShowId) {
			try {
				const show = await Show.findByPk(_backstageConfiguration.selectedShowId);
				if (show) {
					await show.update({
						curtainsOverride: SceneSetting.AUTOMATIC,
						chatEnabledOverride: SceneSetting.AUTOMATIC,
						gratitudeEffectsEnabledOverride: SceneSetting.AUTOMATIC,
						criticalEffectsEnabledOverride: SceneSetting.AUTOMATIC,
						visitorAudioEnabledOverride: SceneSetting.AUTOMATIC,
						visitorVideoEnabledOverride: SceneSetting.AUTOMATIC,
					});
					console.log(`[Config] Settings reset persisted to show: ${show.name} (ID: ${show.id})`);
				}
			} catch (error) {
				console.error("[Config] Error persisting reset to show:", error);
			}
		}

		return { success: true };
	}),

	/**
	 * Select Show - Set active show for persistent operations
	 * Optionally loads show configuration into runtime state
	 */
	selectShow: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive().optional(),
			}),
		)
		.mutation(async ({ input: { showId } }): Promise<{ success: boolean }> => {
			try {
				if (showId) {
					const show = await Show.findByPk(showId);
					if (!show) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Show not found",
						});
					}

					_backstageConfiguration.selectedShowId = showId;

					// Optionally load show configuration into runtime state
					if (loadIntoRuntime) {
					} else {
						console.log(`[Config] Selected show: ${show.name} (ID: ${showId})`);
					}
				} else {
					// Clear selection
					_backstageConfiguration.selectedShowId = undefined;
					console.log("[Config] Cleared show selection");
				}

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[Config] Error selecting show:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to select show",
				});
			}
		}),

	/**
	 * Update Show Metadata - Update name, description, nomenclature
	 */
	updateShowMetadata: editableShowProcedure
		.input(
			z.object({
				showId: z.number().int().positive().optional(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
				nomenclature: z.string().min(1).max(100).optional(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			const targetShowId = input.showId || _backstageConfiguration.selectedShowId;

			if (!targetShowId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No show specified and no show currently selected",
				});
			}

			try {
				const show = await Show.findByPk(targetShowId);
				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				// Check for name conflicts
				if (input.name && input.name !== show.name) {
					const existingShow = await Show.findOne({
						where: { name: input.name },
					});
					if (existingShow) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "A show with this name already exists",
						});
					}
				}

				const updateData: Record<string, any> = {};
				if (input.name !== undefined) updateData.name = input.name;
				if (input.description !== undefined) updateData.description = input.description;
				if (input.nomenclature !== undefined) updateData.nomenclature = input.nomenclature;

				if (Object.keys(updateData).length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "At least one field must be provided",
					});
				}

				await show.update(updateData);
				console.log(`[Config] Updated metadata for show: ${show.name} (ID: ${show.id})`);
				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				console.error("[Config] Error updating show metadata:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update show metadata",
				});
			}
		}),

	/**
	 * Sync Runtime to Show - Persist all current runtime configuration to selected show
	 * @requires Manager role
	 */
	syncToShow: editableShowProcedure.mutation(async (): Promise<{ success: boolean }> => {
		if (!_backstageConfiguration.selectedShowId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "No show selected for sync operation",
			});
		}

		try {
			const show = await Show.findByPk(_backstageConfiguration.selectedShowId);
			if (!show) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selected show not found",
				});
			}

			await show.update({
				showPassword: _backstageConfiguration.password || "",
				curtainsOverride: _backstageConfiguration.sceneSettings.curtains,
				chatEnabledOverride: _backstageConfiguration.sceneSettings.chatEnabled,
				gratitudeEffectsEnabledOverride: _backstageConfiguration.sceneSettings.gratitudeEffectsEnabled,
				criticalEffectsEnabledOverride: _backstageConfiguration.sceneSettings.criticalEffectsEnabled,
				visitorAudioEnabledOverride: _backstageConfiguration.sceneSettings.visitorAudioEnabled,
				visitorVideoEnabledOverride: _backstageConfiguration.sceneSettings.visitorVideoEnabled,
				currentScene: _backstageConfiguration.currentScene,
			});

			console.log(`[Config] Runtime configuration synced to show: ${show.name} (ID: ${show.id})`);
			return { success: true };
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}
			console.error("[Config] Error syncing to show:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to sync configuration to show",
			});
		}
	}),

	/**
	 * Get Current Stage Show - Get currently loaded show (for backward compatibility)
	 */
	getCurrentStageShow: trcpProcedure.query(async (): Promise<PublicShowData | null> => {
		try {
			const { getCurrentShowConfig } = await import("../lib/showConfigLoader");
			const config = getCurrentShowConfig();

			if (!config) {
				return null;
			}

			return {
				id: config.id,
				name: config.name,
				description: config.description,
				nomenclature: config.nomenclature,
				isPasswordProtected: Boolean(config.showPassword && config.showPassword.trim() !== ""),
				curtainsOverride: config.curtainsOverride,
				chatEnabledOverride: config.chatEnabledOverride,
				gratitudeEffectsEnabledOverride: config.gratitudeEffectsEnabledOverride,
				criticalEffectsEnabledOverride: config.criticalEffectsEnabledOverride,
				visitorAudioEnabledOverride: config.visitorAudioEnabledOverride,
				visitorVideoEnabledOverride: config.visitorVideoEnabledOverride,
				currentScene: config.currentScene,
				lastOnlineAt: config.lastOnlineAt,
				createdAt: config.createdAt,
				updatedAt: config.updatedAt,
			};
		} catch (error) {
			console.error("[Config] Error getting current stage show:", error);
			return null;
		}
	}),
});

/**
 * Get stage configuration (for use by other routers)
 */
export function getStageConfig() {
	return _backstageConfiguration;
}

/**
 * Get current scene with resolved settings (for use by other routers)
 */
export function getCurrentSceneWithSettings(): Scene | undefined {
	if (!_backstageConfiguration.currentScene) return undefined;

	return {
		name: _backstageConfiguration.currentScene.name,
		layout: _backstageConfiguration.currentScene.layout,
		curtains: _determineStateOfSetting("curtains"),
		chatEnabled: _determineStateOfSetting("chatEnabled"),
		gratitudeEffectsEnabled: _determineStateOfSetting("gratitudeEffectsEnabled"),
		criticalEffectsEnabled: _determineStateOfSetting("criticalEffectsEnabled"),
		visitorAudioEnabled: _determineStateOfSetting("visitorAudioEnabled"),
		visitorVideoEnabled: _determineStateOfSetting("visitorVideoEnabled"),
	};
}

/**
 * Determine the effective state of a setting based on overrides and scene config
 */
function _determineStateOfSetting(key: keyof typeof _backstageConfiguration.sceneSettings): boolean {
	if (_backstageConfiguration.sceneSettings[key] === SceneSetting.FORCED_ON) {
		return true;
	}

	if (_backstageConfiguration.sceneSettings[key] === SceneSetting.FORCED_OFF) {
		return false;
	}

	if (_backstageConfiguration.currentScene) {
		return _backstageConfiguration.currentScene[key];
	}

	return false;
}

/** Configuration Router Type */
export type ConfigRouter = typeof backstageRouter;

// Backward compatibility exports
export const getSceneConfig = getStageConfig;
