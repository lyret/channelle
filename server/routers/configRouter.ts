import type { PublicShowData } from "./showsRouter";
import type { Scene } from "../_types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { trpc } from "../lib";
import { SceneSetting } from "../_types";
import { Show } from "../models/Show";
import { authedProcedure } from "./authRouter";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Procedure that validates the show is editable (not previously shown)
 * Extends authedProcedure with additional validation for show editing
 */
const editableShowProcedure = authedProcedure.use(async ({ ctx, next }) => {
	// Check if there's a selected show that needs validation
	if (_stageConfig.selectedShowId) {
		try {
			const show = await Show.findByPk(_stageConfig.selectedShowId);
			if (show && show.lastOnlineAt !== null) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot edit a show that has been already shown",
				});
			}
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}
			console.error("[Config] Error validating show editability:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to validate show editability",
			});
		}
	}

	return next({ ctx });
});

// Global state for stage configuration
const _stageConfig = {
	// Runtime state
	password: undefined as string | undefined,
	sceneSettings: {
		curtains: SceneSetting.AUTOMATIC,
		chatEnabled: SceneSetting.AUTOMATIC,
		effectsEnabled: SceneSetting.AUTOMATIC,
		visitorAudioEnabled: SceneSetting.AUTOMATIC,
		visitorVideoEnabled: SceneSetting.AUTOMATIC,
	},
	currentScene: undefined as Scene | undefined,
	// Show selection for persistent operations
	selectedShowId: undefined as number | undefined,
};

/**
 * Configuration Router - Unified stage configuration management
 * Handles all stage configuration including scenes, settings, passwords, and show metadata
 */
export const configRouter = trcpRouter({
	/**
	 * Get Stage Configuration - Complete unified view of stage configuration
	 * Combines runtime state with persistent show data when available
	 */
	getConfig: trcpProcedure.query(async () => {
		// Get runtime scene configuration
		const currentScene =
			(_stageConfig.currentScene && {
				name: _stageConfig.currentScene.name,
				layout: _stageConfig.currentScene.layout,
				curtains: _determineStateOfSetting("curtains"),
				chatEnabled: _determineStateOfSetting("chatEnabled"),
				effectsEnabled: _determineStateOfSetting("effectsEnabled"),
				visitorAudioEnabled: _determineStateOfSetting("visitorAudioEnabled"),
				visitorVideoEnabled: _determineStateOfSetting("visitorVideoEnabled"),
			}) ||
			undefined;

		// Get show metadata if a show is selected
		let showMetadata: PublicShowData | null = null;
		if (_stageConfig.selectedShowId) {
			try {
				const show = await Show.findByPk(_stageConfig.selectedShowId);
				if (show) {
					showMetadata = {
						id: show.id,
						name: show.name,
						description: show.description,
						nomenclature: show.nomenclature,
						isPasswordProtected: Boolean(show.showPassword && show.showPassword.trim() !== ""),
						curtainsOverride: show.curtainsOverride,
						chatEnabledOverride: show.chatEnabledOverride,
						effectsEnabledOverride: show.effectsEnabledOverride,
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
			password: _stageConfig.password,
			sceneSettings: _stageConfig.sceneSettings,
			currentScene,
			// Show metadata (if available)
			selectedShowId: _stageConfig.selectedShowId,
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
			_stageConfig.password = password;

			// Optionally persist to selected show
			if (persistToShow && _stageConfig.selectedShowId) {
				try {
					const show = await Show.findByPk(_stageConfig.selectedShowId);
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
				key: z.enum(["curtains", "chatEnabled", "effectsEnabled", "visitorAudioEnabled", "visitorVideoEnabled"]),
				value: z.nativeEnum(SceneSetting),
				persistToShow: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input: { key, value, persistToShow } }) => {
			// Set runtime override
			_stageConfig.sceneSettings[key] = value;

			// Optionally persist to selected show
			if (persistToShow && _stageConfig.selectedShowId) {
				try {
					const show = await Show.findByPk(_stageConfig.selectedShowId);
					if (show) {
						const fieldMap = {
							curtains: "curtainsOverride",
							chatEnabled: "chatEnabledOverride",
							effectsEnabled: "effectsEnabledOverride",
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
			_stageConfig.currentScene = scene || undefined;

			// Optionally persist to selected show
			if (persistToShow && _stageConfig.selectedShowId) {
				try {
					const show = await Show.findByPk(_stageConfig.selectedShowId);
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
		_stageConfig.sceneSettings = {
			curtains: SceneSetting.AUTOMATIC,
			chatEnabled: SceneSetting.AUTOMATIC,
			effectsEnabled: SceneSetting.AUTOMATIC,
			visitorAudioEnabled: SceneSetting.AUTOMATIC,
			visitorVideoEnabled: SceneSetting.AUTOMATIC,
		};

		// Optionally persist to selected show
		if (persistToShow && _stageConfig.selectedShowId) {
			try {
				const show = await Show.findByPk(_stageConfig.selectedShowId);
				if (show) {
					await show.update({
						curtainsOverride: SceneSetting.AUTOMATIC,
						chatEnabledOverride: SceneSetting.AUTOMATIC,
						effectsEnabledOverride: SceneSetting.AUTOMATIC,
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
				loadIntoRuntime: z.boolean().default(false),
			}),
		)
		.mutation(async ({ input: { showId, loadIntoRuntime } }): Promise<{ success: boolean }> => {
			try {
				if (showId) {
					const show = await Show.findByPk(showId);
					if (!show) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Show not found",
						});
					}

					_stageConfig.selectedShowId = showId;

					// Optionally load show configuration into runtime state
					if (loadIntoRuntime) {
						_stageConfig.password = show.showPassword || undefined;
						_stageConfig.sceneSettings = {
							curtains: show.curtainsOverride || SceneSetting.AUTOMATIC,
							chatEnabled: show.chatEnabledOverride || SceneSetting.AUTOMATIC,
							effectsEnabled: show.effectsEnabledOverride || SceneSetting.AUTOMATIC,
							visitorAudioEnabled: show.visitorAudioEnabledOverride || SceneSetting.AUTOMATIC,
							visitorVideoEnabled: show.visitorVideoEnabledOverride || SceneSetting.AUTOMATIC,
						};
						_stageConfig.currentScene = show.currentScene;
						console.log(`[Config] Loaded show configuration into runtime: ${show.name} (ID: ${showId})`);
					} else {
						console.log(`[Config] Selected show: ${show.name} (ID: ${showId})`);
					}
				} else {
					// Clear selection
					_stageConfig.selectedShowId = undefined;
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
			const targetShowId = input.showId || _stageConfig.selectedShowId;

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
		if (!_stageConfig.selectedShowId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "No show selected for sync operation",
			});
		}

		try {
			const show = await Show.findByPk(_stageConfig.selectedShowId);
			if (!show) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selected show not found",
				});
			}

			await show.update({
				showPassword: _stageConfig.password || "",
				curtainsOverride: _stageConfig.sceneSettings.curtains,
				chatEnabledOverride: _stageConfig.sceneSettings.chatEnabled,
				effectsEnabledOverride: _stageConfig.sceneSettings.effectsEnabled,
				visitorAudioEnabledOverride: _stageConfig.sceneSettings.visitorAudioEnabled,
				visitorVideoEnabledOverride: _stageConfig.sceneSettings.visitorVideoEnabled,
				currentScene: _stageConfig.currentScene,
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
				effectsEnabledOverride: config.effectsEnabledOverride,
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
	return _stageConfig;
}

/**
 * Get current scene with resolved settings (for use by other routers)
 */
export function getCurrentSceneWithSettings(): Scene | undefined {
	if (!_stageConfig.currentScene) return undefined;

	return {
		name: _stageConfig.currentScene.name,
		layout: _stageConfig.currentScene.layout,
		curtains: _determineStateOfSetting("curtains"),
		chatEnabled: _determineStateOfSetting("chatEnabled"),
		effectsEnabled: _determineStateOfSetting("effectsEnabled"),
		visitorAudioEnabled: _determineStateOfSetting("visitorAudioEnabled"),
		visitorVideoEnabled: _determineStateOfSetting("visitorVideoEnabled"),
	};
}

/**
 * Determine the effective state of a setting based on overrides and scene config
 */
function _determineStateOfSetting(key: keyof typeof _stageConfig.sceneSettings): boolean {
	if (_stageConfig.sceneSettings[key] === SceneSetting.FORCED_ON) {
		return true;
	}

	if (_stageConfig.sceneSettings[key] === SceneSetting.FORCED_OFF) {
		return false;
	}

	if (_stageConfig.currentScene) {
		return _stageConfig.currentScene[key];
	}

	return false;
}

/** Configuration Router Type */
export type ConfigRouter = typeof configRouter;

// Backward compatibility exports
export const getSceneConfig = getStageConfig;
