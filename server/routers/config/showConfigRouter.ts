import type { PublicShowData } from "../../../shared/types/show.js";
import { Show } from "../../models/Show";
import { TRPCError } from "@trpc/server";
import { trpc } from "../../lib";
import { z } from "zod";
import type { Scene, SceneSetting } from "../../_types";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Show Configuration Router - Handles show configuration updates for instruments
 * This is separate from the main show CRUD operations and focuses on configuration fields
 */
export const showConfigRouter = trcpRouter({
	/**
	 * Get show configuration by ID
	 */
	getConfig: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
			}),
		)
		.query(async ({ input }): Promise<PublicShowData | null> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					return null;
				}

				return {
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
					createdAt: show.createdAt,
					updatedAt: show.updatedAt,
				};
			} catch (error) {
				console.error("[ShowConfigRouter] Error fetching show config:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch show configuration",
				});
			}
		}),

	/**
	 * Update show password
	 */
	updatePassword: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
				password: z.string().optional(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				await show.update({
					showPassword: input.password || "",
				});

				console.log(`[ShowConfigRouter] Updated password for show: ${show.name} (ID: ${show.id})`);
				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowConfigRouter] Error updating show password:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update show password",
				});
			}
		}),

	/**
	 * Update scene override settings
	 */
	updateSceneOverride: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
				setting: z.enum(["curtains", "chatEnabled", "effectsEnabled", "visitorAudioEnabled", "visitorVideoEnabled"]),
				value: z.number().int().min(0).max(2), // SceneSetting enum values
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				// Map setting name to database field
				const fieldMap = {
					curtains: "curtainsOverride",
					chatEnabled: "chatEnabledOverride",
					effectsEnabled: "effectsEnabledOverride",
					visitorAudioEnabled: "visitorAudioEnabledOverride",
					visitorVideoEnabled: "visitorVideoEnabledOverride",
				};

				const fieldName = fieldMap[input.setting];
				if (!fieldName) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid setting name",
					});
				}

				await show.update({
					[fieldName]: input.value,
				});

				console.log(`[ShowConfigRouter] Updated ${input.setting} override to ${input.value} for show: ${show.name} (ID: ${show.id})`);
				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowConfigRouter] Error updating scene override:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update scene override setting",
				});
			}
		}),

	/**
	 * Update current active scene
	 */
	updateCurrentScene: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
				scene: z
					.object({
						name: z.string(),
						layout: z.array(
							z.array(
								z.union([
									z.object({ type: z.literal("actor"), peerId: z.string() }),
									z.object({ type: z.literal("chat") }),
									z.object({ type: z.literal("empty") }),
								]),
							),
						),
						curtains: z.boolean(),
						chatEnabled: z.boolean(),
						effectsEnabled: z.boolean(),
						visitorAudioEnabled: z.boolean(),
						visitorVideoEnabled: z.boolean(),
					})
					.nullable(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				await show.update({
					currentScene: input.scene,
				});

				console.log(`[ShowConfigRouter] Updated current scene to "${input.scene?.name || "null"}" for show: ${show.name} (ID: ${show.id})`);
				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowConfigRouter] Error updating current scene:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update current scene",
				});
			}
		}),

	/**
	 * Update multiple configuration settings at once
	 */
	updateConfig: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
				config: z
					.object({
						showPassword: z.string().optional(),
						curtainsOverride: z.number().int().min(0).max(2).optional(),
						chatEnabledOverride: z.number().int().min(0).max(2).optional(),
						effectsEnabledOverride: z.number().int().min(0).max(2).optional(),
						visitorAudioEnabledOverride: z.number().int().min(0).max(2).optional(),
						visitorVideoEnabledOverride: z.number().int().min(0).max(2).optional(),
						currentScene: z
							.object({
								name: z.string(),
								layout: z.array(
									z.array(
										z.union([
											z.object({ type: z.literal("actor"), peerId: z.string() }),
											z.object({ type: z.literal("chat") }),
											z.object({ type: z.literal("empty") }),
										]),
									),
								),
								curtains: z.boolean(),
								chatEnabled: z.boolean(),
								effectsEnabled: z.boolean(),
								visitorAudioEnabled: z.boolean(),
								visitorVideoEnabled: z.boolean(),
							})
							.nullable()
							.optional(),
					})
					.refine((data) => Object.keys(data).length > 0, {
						message: "At least one configuration field must be provided",
					}),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				const updateData: Record<string, any> = {};

				// Only include fields that are provided
				if (input.config.showPassword !== undefined) {
					updateData.showPassword = input.config.showPassword;
				}
				if (input.config.curtainsOverride !== undefined) {
					updateData.curtainsOverride = input.config.curtainsOverride;
				}
				if (input.config.chatEnabledOverride !== undefined) {
					updateData.chatEnabledOverride = input.config.chatEnabledOverride;
				}
				if (input.config.effectsEnabledOverride !== undefined) {
					updateData.effectsEnabledOverride = input.config.effectsEnabledOverride;
				}
				if (input.config.visitorAudioEnabledOverride !== undefined) {
					updateData.visitorAudioEnabledOverride = input.config.visitorAudioEnabledOverride;
				}
				if (input.config.visitorVideoEnabledOverride !== undefined) {
					updateData.visitorVideoEnabledOverride = input.config.visitorVideoEnabledOverride;
				}
				if (input.config.currentScene !== undefined) {
					updateData.currentScene = input.config.currentScene;
				}

				await show.update(updateData);

				const updatedFields = Object.keys(updateData).join(", ");
				console.log(`[ShowConfigRouter] Bulk updated configuration (${updatedFields}) for show: ${show.name} (ID: ${show.id})`);
				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowConfigRouter] Error updating show configuration:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update show configuration",
				});
			}
		}),

	/**
	 * Update show metadata (name and description)
	 */
	updateMetadata: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
				nomenclature: z.string().min(1).max(100).optional(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				// Check if new name conflicts with existing shows (if name is being changed)
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
				if (input.name !== undefined) {
					updateData.name = input.name;
				}
				if (input.description !== undefined) {
					updateData.description = input.description;
				}
				if (input.nomenclature !== undefined) {
					updateData.nomenclature = input.nomenclature;
				}

				if (Object.keys(updateData).length === 0) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "At least one field (name, description, or nomenclature) must be provided",
					});
				}

				await show.update(updateData);

				console.log(`[ShowConfigRouter] Updated metadata for show: ${show.name} (ID: ${show.id})`);
				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowConfigRouter] Error updating show metadata:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update show metadata",
				});
			}
		}),

	/**
	 * Get current show configuration loaded in stage mode
	 * Returns null if no show is loaded or if in theater mode
	 */
	getCurrentStageShow: trcpProcedure.query(async (): Promise<PublicShowData | null> => {
		try {
			// Import the current show config function
			const { getCurrentShowConfig } = await import("../../lib/showConfigLoader");

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
				createdAt: config.createdAt,
				updatedAt: config.updatedAt,
			};
		} catch (error) {
			console.error("[ShowConfigRouter] Error getting current stage show:", error);
			return null;
		}
	}),
});

/** Show Configuration Router Type */
export type ShowConfigRouter = typeof showConfigRouter;
