import type { CreateStageData, UpdateStageData, PublicStageData, StageListItem, StageAuthRequest, StageAuthResponse } from "../_types";
import { Stage } from "../models/Stage";
import { TRPCError } from "@trpc/server";
import { trpc, sequelize } from "../lib";
import { z } from "zod";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Stage Router - Handles stage CRUD operations
 */
export const stageRouter = trcpRouter({
	/**
	 * Get all stages (public information only)
	 */
	list: trcpProcedure.query(async (): Promise<StageListItem[]> => {
		try {
			const stages = await Stage.findAll({
				order: [["updatedAt", "DESC"]],
			});

			return stages.map((stage) => ({
				id: stage.id,
				name: stage.name,
				description: stage.description,
				isPasswordProtected: Boolean(stage.stagePassword && stage.stagePassword.trim() !== ""),
				isOnline: false, // TODO: Implement online status detection
				participantCount: 0, // TODO: Implement participant counting
				url: `/stage/${stage.id}`,
			}));
		} catch (error) {
			console.error("[StageRouter] Error fetching stages:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to fetch stages",
			});
		}
	}),

	/**
	 * Get a single stage by ID (public information only)
	 */
	get: trcpProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.query(async ({ input }): Promise<PublicStageData | null> => {
			try {
				const stage = await Stage.findByPk(input.id);

				if (!stage) {
					return null;
				}

				return {
					id: stage.id,
					name: stage.name,
					description: stage.description,
					isPasswordProtected: Boolean(stage.stagePassword && stage.stagePassword.trim() !== ""),
					createdAt: stage.createdAt,
					updatedAt: stage.updatedAt,
				};
			} catch (error) {
				console.error("[StageRouter] Error fetching stage:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to fetch stage",
				});
			}
		}),

	/**
	 * Create a new stage
	 */
	create: trcpProcedure
		.input(
			z.object({
				name: z.string().min(1).max(255),
				description: z.string().optional().default(""),
				stagePassword: z.string().optional().default(""),
			}),
		)
		.mutation(async ({ input }): Promise<PublicStageData> => {
			try {
				// Check if stage name already exists
				const existingStage = await Stage.findOne({
					where: { name: input.name },
				});

				if (existingStage) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "A stage with this name already exists",
					});
				}

				const stage = await Stage.create({
					name: input.name,
					description: input.description || "",
					stagePassword: input.stagePassword || "",
				});

				console.log(`[StageRouter] Created new stage: ${stage.name} (ID: ${stage.id})`);

				return {
					id: stage.id,
					name: stage.name,
					description: stage.description,
					isPasswordProtected: Boolean(stage.stagePassword && stage.stagePassword.trim() !== ""),
					createdAt: stage.createdAt,
					updatedAt: stage.updatedAt,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[StageRouter] Error creating stage:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create stage",
				});
			}
		}),

	/**
	 * Update an existing stage
	 */
	update: trcpProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
				name: z.string().min(1).max(255).optional(),
				description: z.string().optional(),
				stagePassword: z.string().optional(),
			}),
		)
		.mutation(async ({ input }): Promise<PublicStageData> => {
			try {
				const stage = await Stage.findByPk(input.id);

				if (!stage) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Stage not found",
					});
				}

				// Check if new name conflicts with existing stages (if name is being changed)
				if (input.name && input.name !== stage.name) {
					const existingStage = await Stage.findOne({
						where: { name: input.name },
					});

					if (existingStage) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "A stage with this name already exists",
						});
					}
				}

				// Update the stage
				await stage.update({
					...(input.name !== undefined && { name: input.name }),
					...(input.description !== undefined && { description: input.description }),
					...(input.stagePassword !== undefined && { stagePassword: input.stagePassword }),
				});

				console.log(`[StageRouter] Updated stage: ${stage.name} (ID: ${stage.id})`);

				return {
					id: stage.id,
					name: stage.name,
					description: stage.description,
					isPasswordProtected: Boolean(stage.stagePassword && stage.stagePassword.trim() !== ""),
					createdAt: stage.createdAt,
					updatedAt: stage.updatedAt,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[StageRouter] Error updating stage:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update stage",
				});
			}
		}),

	/**
	 * Delete a stage
	 */
	delete: trcpProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }): Promise<{ success: boolean }> => {
			try {
				const stage = await Stage.findByPk(input.id);

				if (!stage) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Stage not found",
					});
				}

				await stage.destroy();
				console.log(`[StageRouter] Deleted stage: ${stage.name} (ID: ${stage.id})`);

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[StageRouter] Error deleting stage:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to delete stage",
				});
			}
		}),

	/**
	 * Authenticate access to a password-protected stage
	 */
	authenticate: trcpProcedure
		.input(
			z.object({
				stageId: z.number().int().positive(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input }): Promise<StageAuthResponse> => {
			try {
				const stage = await Stage.findByPk(input.stageId);

				if (!stage) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Stage not found",
					});
				}

				// Check if stage is password protected
				const isPasswordProtected = Boolean(stage.stagePassword && stage.stagePassword.trim() !== "");

				if (!isPasswordProtected) {
					// Stage is not password protected, allow access
					return {
						success: true,
						stageData: {
							id: stage.id,
							name: stage.name,
							description: stage.description,
							isPasswordProtected: false,
							createdAt: stage.createdAt,
							updatedAt: stage.updatedAt,
						},
					};
				}

				// Verify password
				if (input.password !== stage.stagePassword) {
					return {
						success: false,
						message: "Invalid password",
					};
				}

				console.log(`[StageRouter] Authenticated access to stage: ${stage.name} (ID: ${stage.id})`);

				return {
					success: true,
					stageData: {
						id: stage.id,
						name: stage.name,
						description: stage.description,
						isPasswordProtected: true,
						createdAt: stage.createdAt,
						updatedAt: stage.updatedAt,
					},
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				console.error("[StageRouter] Error authenticating stage access:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to authenticate stage access",
				});
			}
		}),
});

/** Stage Router Type */
export type StageRouter = typeof stageRouter;
