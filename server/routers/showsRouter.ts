import { Show } from "../models/Show";
import { getActiveAdapter, isLauncherReady } from "../launchers";

import type { Scene, SceneSetting } from "../_types";
import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { z } from "zod";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/** Public show information (without sensitive data like password) */
export interface PublicShowData {
	id: number;
	name: string;
	description: string;
	nomenclature: string;
	isPasswordProtected: boolean;
	curtainsOverride: SceneSetting;
	chatEnabledOverride: SceneSetting;
	gratitudeEffectsEnabledOverride: SceneSetting;
	criticalEffectsEnabledOverride: SceneSetting;
	visitorAudioEnabledOverride: SceneSetting;
	visitorVideoEnabledOverride: SceneSetting;
	currentScene: Scene | null;
	lastOnlineAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

/** Show list item for displaying in UI */
export interface ShowListItem {
	id: number;
	name: string;
	description: string;
	isPasswordProtected: boolean;
	isOnline: boolean;
	lastOnlineAt: Date | null;
	participantCount: number;
	url: string;
}

/** Show authentication response */
export interface ShowAuthResponse {
	success: boolean;
	message?: string;
	showData?: PublicShowData;
}

/**
 * Shows Router - Handles show CRUD operations
 */
export const showsRouter = trcpRouter({
	/**
	 * Get all shows (public information only)
	 */
	list: trcpProcedure.query(async (): Promise<ShowListItem[]> => {
		try {
			const shows = await Show.findAll({
				order: [["updatedAt", "DESC"]],
			});

			// Check for running instances
			let runningInstances: Array<{ showId: number; url: string }> = [];
			if (isLauncherReady()) {
				const activeAdapter = getActiveAdapter();
				if (activeAdapter) {
					try {
						const instances = await activeAdapter.getInstances();
						runningInstances = instances
							.filter((instance) => instance.status === "running" || instance.status === "starting")
							.map((instance) => ({ showId: instance.showId, url: instance.url }));
					} catch (error) {
						console.error("[ShowRouter] Error getting instances:", error);
					}
				}
			}

			return shows.map((show) => {
				const runningInstance = runningInstances.find((instance) => instance.showId === show.id);
				const isCurrentlyOnline = Boolean(runningInstance);

				return {
					id: show.id,
					name: show.name,
					description: show.description,
					isPasswordProtected: Boolean(show.showPassword && show.showPassword.trim() !== ""),
					isOnline: isCurrentlyOnline,
					lastOnlineAt: show.lastOnlineAt,
					participantCount: 0, // TODO: Implement participant counting
					url: runningInstance ? runningInstance.url : `/stage/${show.id}`,
				};
			});
		} catch (error) {
			console.error("[ShowRouter] Error fetching shows:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch shows",
			});
		}
	}),

	/**
	 * Get a single show by ID (public information only)
	 */
	get: trcpProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.query(async ({ input }): Promise<PublicShowData | null> => {
			try {
				const show = await Show.findByPk(input.id);

				if (!show) {
					return null;
				}

				return {
					id: show.id,
					name: show.name,
					description: show.description,
					nomenclature: show.nomenclature,
					isPasswordProtected: Boolean(show.showPassword && show.showPassword.trim() !== ""),
					lastOnlineAt: show.lastOnlineAt,
					curtainsOverride: show.curtainsOverride,
					chatEnabledOverride: show.chatEnabledOverride,
					gratitudeEffectsEnabledOverride: show.gratitudeEffectsEnabledOverride,
					criticalEffectsEnabledOverride: show.criticalEffectsEnabledOverride,
					visitorAudioEnabledOverride: show.visitorAudioEnabledOverride,
					visitorVideoEnabledOverride: show.visitorVideoEnabledOverride,
					currentScene: show.currentScene,
					createdAt: show.createdAt,
					updatedAt: show.updatedAt,
				};
			} catch (error) {
				console.error("[ShowRouter] Error fetching show:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch show",
				});
			}
		}),

	/**
	 * Create a new show
	 */
	create: trcpProcedure
		.input(
			z.object({
				name: z.string().min(1).max(255),
				description: z.string().optional().default(""),
				nomenclature: z.string().min(1).max(100).optional().default("föreställningen"),
				showPassword: z.string().optional().default(""),
				curtainsOverride: z.number().int().min(0).max(2).optional().default(0),
				chatEnabledOverride: z.number().int().min(0).max(2).optional().default(0),
				gratitudeEffectsEnabledOverride: z.number().int().min(0).max(2).optional().default(0),
				criticalEffectsEnabledOverride: z.number().int().min(0).max(2).optional().default(0),
				visitorAudioEnabledOverride: z.number().int().min(0).max(2).optional().default(0),
				visitorVideoEnabledOverride: z.number().int().min(0).max(2).optional().default(0),
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
						gratitudeEffectsEnabled: z.boolean(),
						criticalEffectsEnabled: z.boolean(),
						visitorAudioEnabled: z.boolean(),
						visitorVideoEnabled: z.boolean(),
					})
					.optional()
					.nullable()
					.default(null),
			}),
		)
		.mutation(async ({ input }): Promise<PublicShowData> => {
			try {
				// Check if show name already exists
				const existingShow = await Show.findOne({
					where: { name: input.name },
				});

				if (existingShow) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A show with this name already exists",
					});
				}

				const show = await Show.create({
					name: input.name,
					description: input.description || "",
					nomenclature: input.nomenclature || "föreställningen",
					showPassword: input.showPassword || "",
					curtainsOverride: input.curtainsOverride || 0,
					chatEnabledOverride: input.chatEnabledOverride || 0,
					gratitudeEffectsEnabledOverride: input.gratitudeEffectsEnabledOverride || 0,
					criticalEffectsEnabledOverride: input.criticalEffectsEnabledOverride || 0,
					visitorAudioEnabledOverride: input.visitorAudioEnabledOverride || 0,
					visitorVideoEnabledOverride: input.visitorVideoEnabledOverride || 0,
					currentScene: input.currentScene || null,
				});

				console.log(`[ShowRouter] Created new show: ${show.name} (ID: ${show.id})`);

				return {
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
					createdAt: show.createdAt,
					updatedAt: show.updatedAt,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowRouter] Error creating show:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create show",
				});
			}
		}),

	/**
	 * Update an existing show
	 */
	update: trcpProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
				nomenclature: z.string().min(1).max(100).optional(),
				showPassword: z.string().optional(),
				curtainsOverride: z.number().int().min(0).max(2).optional(),
				chatEnabledOverride: z.number().int().min(0).max(2).optional(),
				gratitudeEffectsEnabledOverride: z.number().int().min(0).max(2).optional(),
				criticalEffectsEnabledOverride: z.number().int().min(0).max(2).optional(),
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
						gratitudeEffectsEnabled: z.boolean(),
						criticalEffectsEnabled: z.boolean(),
						visitorAudioEnabled: z.boolean(),
						visitorVideoEnabled: z.boolean(),
					})
					.optional()
					.nullable(),
			}),
		)
		.mutation(async ({ input }): Promise<PublicShowData> => {
			try {
				const show = await Show.findByPk(input.id);

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

				// Update the show
				await show.update({
					...(input.name !== undefined && { name: input.name }),
					...(input.description !== undefined && { description: input.description }),
					...(input.nomenclature !== undefined && { nomenclature: input.nomenclature }),
					...(input.showPassword !== undefined && { showPassword: input.showPassword }),
					...(input.curtainsOverride !== undefined && { curtainsOverride: input.curtainsOverride }),
					...(input.chatEnabledOverride !== undefined && { chatEnabledOverride: input.chatEnabledOverride }),
					...(input.gratitudeEffectsEnabledOverride !== undefined && { gratitudeEffectsEnabledOverride: input.gratitudeEffectsEnabledOverride }),
					...(input.criticalEffectsEnabledOverride !== undefined && { criticalEffectsEnabledOverride: input.criticalEffectsEnabledOverride }),
					...(input.visitorAudioEnabledOverride !== undefined && { visitorAudioEnabledOverride: input.visitorAudioEnabledOverride }),
					...(input.visitorVideoEnabledOverride !== undefined && { visitorVideoEnabledOverride: input.visitorVideoEnabledOverride }),
					...(input.currentScene !== undefined && { currentScene: input.currentScene }),
				});

				console.log(`[ShowRouter] Updated show: ${show.name} (ID: ${show.id})`);

				return {
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
					createdAt: show.createdAt,
					updatedAt: show.updatedAt,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowRouter] Error updating show:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update show",
				});
			}
		}),

	/**
	 * Delete a show
	 */
	delete: trcpProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const show = await Show.findByPk(input.id);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				await show.destroy();
				console.log(`[ShowRouter] Deleted show: ${show.name} (ID: ${show.id})`);

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowRouter] Error deleting show:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete show",
				});
			}
		}),

	/**
	 * Authenticate access to a password-protected show
	 */
	authenticate: trcpProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input }): Promise<ShowAuthResponse> => {
			try {
				const show = await Show.findByPk(input.showId);

				if (!show) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Show not found",
					});
				}

				// Check if show is password protected
				const isPasswordProtected = Boolean(show.showPassword && show.showPassword.trim() !== "");

				if (!isPasswordProtected) {
					// Show is not password protected, allow access
					return {
						success: true,
						showData: {
							id: show.id,
							name: show.name,
							description: show.description,
							nomenclature: show.nomenclature,
							isPasswordProtected: false,
							curtainsOverride: show.curtainsOverride,
							chatEnabledOverride: show.chatEnabledOverride,
							gratitudeEffectsEnabledOverride: show.gratitudeEffectsEnabledOverride,
							criticalEffectsEnabledOverride: show.criticalEffectsEnabledOverride,
							visitorAudioEnabledOverride: show.visitorAudioEnabledOverride,
							visitorVideoEnabledOverride: show.visitorVideoEnabledOverride,
							currentScene: show.currentScene,
							createdAt: show.createdAt,
							updatedAt: show.updatedAt,
						},
					};
				}

				// Verify password
				if (input.password !== show.showPassword) {
					return {
						success: false,
						message: "Invalid password",
					};
				}

				console.log(`[ShowRouter] Authenticated access to show: ${show.name} (ID: ${show.id})`);

				return {
					success: true,
					showData: {
						id: show.id,
						name: show.name,
						description: show.description,
						nomenclature: show.nomenclature,
						isPasswordProtected: true,
						curtainsOverride: show.curtainsOverride,
						chatEnabledOverride: show.chatEnabledOverride,
						gratitudeEffectsEnabledOverride: show.gratitudeEffectsEnabledOverride,
						criticalEffectsEnabledOverride: show.criticalEffectsEnabledOverride,
						visitorAudioEnabledOverride: show.visitorAudioEnabledOverride,
						visitorVideoEnabledOverride: show.visitorVideoEnabledOverride,
						currentScene: show.currentScene,
						createdAt: show.createdAt,
						updatedAt: show.updatedAt,
					},
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[ShowRouter] Error authenticating show access:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to authenticate show access",
				});
			}
		}),

	/**
	 * Authenticate theater access with global password
	 */
	authenticateTheater: trcpProcedure
		.input(
			z.object({
				password: z.string(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean; message?: string }> => {
			try {
				// Get theater password from config
				const theaterPassword = CONFIG.stage.theaterPassword;

				// Verify password
				if (input.password !== theaterPassword) {
					return {
						success: false,
						message: "Invalid theater password",
					};
				}

				console.log("[ShowRouter] Theater authentication successful");

				return {
					success: true,
				};
			} catch (error) {
				console.error("[ShowRouter] Error authenticating theater access:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to authenticate theater access",
				});
			}
		}),
});

/** Show Router Type */
export type ShowRouter = typeof showsRouter;
