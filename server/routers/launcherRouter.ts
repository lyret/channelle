import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { Show } from "../models/Show";
import { getActiveAdapter, isLauncherReady } from "../lib/launcher";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Adapter status information for UI
 */
export interface AdapterStatus {
	name: string;
	displayName: string;
	canLaunch: boolean;
	reason?: string;
	isActive: boolean;
}

/**
 * Launch request input validation
 */
const LaunchRequestSchema = z.object({
	showId: z.number().int().positive("Show ID must be a positive integer"),
	adapterName: z.string().min(1, "Adapter name is required").optional(),
});

/**
 * Stop instance request validation
 */
const StopInstanceSchema = z.object({
	instanceId: z.string().min(1, "Instance ID is required"),
});

/**
 * Instance status request validation
 */
const InstanceStatusSchema = z.object({
	instanceId: z.string().min(1, "Instance ID is required"),
});

/**
 * Launcher Router - Handles theater mode launcher operations
 */
export const launcherRouter = trcpRouter({
	/**
	 * Real-time state synchronization
	 */
	sync: trcpProcedure.query(async () => {
		try {
			const isReady = isLauncherReady();
			const activeAdapter = getActiveAdapter();

			// Get current adapter status
			let adapterStatus: AdapterStatus | null = null;
			let instances = [];

			if (isReady && activeAdapter) {
				const canLaunchResult = await activeAdapter.canLaunch();
				adapterStatus = {
					name: activeAdapter.name,
					displayName: activeAdapter.displayName,
					canLaunch: canLaunchResult.canLaunch,
					reason: canLaunchResult.reason,
					isActive: true,
				};

				// Get current instances
				try {
					instances = await activeAdapter.getInstances();
				} catch (error) {
					console.error("[LauncherRouter] Error getting instances for sync:", error);
				}
			} else {
				adapterStatus = {
					name: "none",
					displayName: "No Launcher",
					canLaunch: false,
					reason: "Launcher system not initialized",
					isActive: true,
				};
			}

			return {
				isReady,
				activeAdapter: activeAdapter?.name || null,
				adapterStatus,
				instances,
			};
		} catch (error) {
			console.error("[LauncherRouter] Error in sync:", error);
			// Return safe defaults on error
			return {
				isReady: false,
				activeAdapter: null,
				adapterStatus: {
					name: "none",
					displayName: "No Launcher",
					canLaunch: false,
					reason: "Error getting launcher status",
					isActive: true,
				},
				instances: [],
			};
		}
	}),

	/**
	 * Get current launcher system status and available adapters
	 */
	getStatus: trcpProcedure.query(
		async (): Promise<{
			isReady: boolean;
			activeAdapter: string | null;
			adapters: AdapterStatus[];
		}> => {
			try {
				const isReady = isLauncherReady();
				const activeAdapter = getActiveAdapter();

				// Get status of all available adapters
				const adapters: AdapterStatus[] = [];

				if (isReady && activeAdapter) {
					// Only check the active adapter since we use single-adapter approach
					const canLaunchResult = await activeAdapter.canLaunch();
					adapters.push({
						name: activeAdapter.name,
						displayName: activeAdapter.displayName,
						canLaunch: canLaunchResult.canLaunch,
						reason: canLaunchResult.reason,
						isActive: true,
					});
				} else {
					// System not ready, show none adapter
					adapters.push({
						name: "none",
						displayName: "No Launcher",
						canLaunch: false,
						reason: "Launcher system not initialized",
						isActive: true,
					});
				}

				return {
					isReady,
					activeAdapter: activeAdapter?.name || null,
					adapters,
				};
			} catch (error) {
				console.error("[LauncherRouter] Error getting launcher status:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to get launcher status",
				});
			}
		},
	),

	/**
	 * Stop all running instances managed by the active adapter
	 */
	stopAll: trcpProcedure.mutation(async () => {
		try {
			if (!isLauncherReady()) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Launcher system is not initialized",
				});
			}

			const activeAdapter = getActiveAdapter();
			if (!activeAdapter) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No active launcher adapter",
				});
			}

			const instances = await activeAdapter.getInstances();
			const runningInstances = instances.filter((instance) => instance.status === "running" || instance.status === "starting");

			if (runningInstances.length === 0) {
				return {
					success: true,
					message: "No running instances to stop",
					stoppedCount: 0,
				};
			}

			// Stop all instances
			const stopPromises = runningInstances.map((instance) =>
				activeAdapter.stop(instance.instanceId).catch((error) => {
					console.error(`[LauncherRouter] Error stopping instance '${instance.instanceId}':`, error);
					return { instanceId: instance.instanceId, error: error.message };
				}),
			);

			await Promise.all(stopPromises);

			console.log(`[LauncherRouter] Stopped ${runningInstances.length} instances using ${activeAdapter.name} adapter`);

			return {
				success: true,
				message: `Stopped ${runningInstances.length} instances`,
				stoppedCount: runningInstances.length,
			};
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}

			console.error("[LauncherRouter] Error stopping all instances:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Failed to stop instances: ${error.message}`,
			});
		}
	}),

	/**
	 * Launch a new stage instance for a show
	 */
	launch: trcpProcedure.input(LaunchRequestSchema).mutation(async ({ input }) => {
		try {
			// Check if launcher system is ready
			if (!isLauncherReady()) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Launcher system is not initialized",
				});
			}

			const activeAdapter = getActiveAdapter();
			if (!activeAdapter) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No active launcher adapter",
				});
			}

			// If adapter name is specified, verify it matches active adapter
			if (input.adapterName && input.adapterName !== activeAdapter.name) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Requested adapter '${input.adapterName}' is not the active adapter '${activeAdapter.name}'`,
				});
			}

			// Get the show
			const show = await Show.findByPk(input.showId);
			if (!show) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Show not found",
				});
			}

			// Check if adapter can launch
			const canLaunchResult = await activeAdapter.canLaunch();
			if (!canLaunchResult.canLaunch) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: canLaunchResult.reason || "Cannot launch instance",
					cause: canLaunchResult.details,
				});
			}

			// Launch the instance
			const launchResult = await activeAdapter.launch(show);

			console.log(
				`[LauncherRouter] Successfully launched instance '${launchResult.instanceId}' for show '${show.name}' using ${activeAdapter.name} adapter`,
			);

			return {
				success: true,
				instanceId: launchResult.instanceId,
				url: launchResult.url,
				port: launchResult.port,
				status: launchResult.status,
				message: launchResult.message || "Instance launched successfully",
				adapterName: activeAdapter.name,
			};
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}

			console.error("[LauncherRouter] Error launching instance:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Failed to launch instance: ${error.message}`,
			});
		}
	}),

	/**
	 * Stop a running instance
	 */
	stop: trcpProcedure.input(StopInstanceSchema).mutation(async ({ input }) => {
		try {
			if (!isLauncherReady()) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Launcher system is not initialized",
				});
			}

			const activeAdapter = getActiveAdapter();
			if (!activeAdapter) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No active launcher adapter",
				});
			}

			// Stop the instance
			await activeAdapter.stop(input.instanceId);

			console.log(`[LauncherRouter] Successfully stopped instance '${input.instanceId}' using ${activeAdapter.name} adapter`);

			return {
				success: true,
				message: `Instance '${input.instanceId}' stopped successfully`,
			};
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}

			console.error("[LauncherRouter] Error stopping instance:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Failed to stop instance: ${error.message}`,
			});
		}
	}),

	/**
	 * Get status of a specific instance
	 */
	getInstanceStatus: trcpProcedure.input(InstanceStatusSchema).query(async ({ input }) => {
		try {
			if (!isLauncherReady()) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Launcher system is not initialized",
				});
			}

			const activeAdapter = getActiveAdapter();
			if (!activeAdapter) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No active launcher adapter",
				});
			}

			const status = await activeAdapter.getStatus(input.instanceId);

			return {
				instanceId: input.instanceId,
				status,
				adapterName: activeAdapter.name,
			};
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}

			console.error("[LauncherRouter] Error getting instance status:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Failed to get instance status: ${error.message}`,
			});
		}
	}),

	/**
	 * Get all instances managed by the active adapter
	 */
	getInstances: trcpProcedure.query(async () => {
		try {
			if (!isLauncherReady()) {
				return {
					instances: [],
					adapterName: null,
				};
			}

			const activeAdapter = getActiveAdapter();
			if (!activeAdapter) {
				return {
					instances: [],
					adapterName: null,
				};
			}

			const instances = await activeAdapter.getInstances();

			return {
				instances,
				adapterName: activeAdapter.name,
			};
		} catch (error) {
			console.error("[LauncherRouter] Error getting instances:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to get instances",
			});
		}
	}),

	/**
	 * Check if the active adapter can currently launch instances
	 */
	canLaunch: trcpProcedure.query(async () => {
		try {
			if (!isLauncherReady()) {
				return {
					canLaunch: false,
					reason: "Launcher system is not initialized",
					adapterName: null,
				};
			}

			const activeAdapter = getActiveAdapter();
			if (!activeAdapter) {
				return {
					canLaunch: false,
					reason: "No active launcher adapter",
					adapterName: null,
				};
			}

			const canLaunchResult = await activeAdapter.canLaunch();

			return {
				canLaunch: canLaunchResult.canLaunch,
				reason: canLaunchResult.reason,
				details: canLaunchResult.details,
				adapterName: activeAdapter.name,
			};
		} catch (error) {
			console.error("[LauncherRouter] Error checking launch capability:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to check launch capability",
			});
		}
	}),
});

/** Launcher Router Type */
export type LauncherRouter = typeof launcherRouter;
