import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { Show } from "../models/Show";
import { getActiveAdapter, isLauncherReady, getAdapterStatus } from "../launchers";
import type { AdapterStatus } from "../launchers/types";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

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
 * Launcher procedure - Common validation for launcher operations
 *
 * Ensures the launcher system is ready and has an active adapter
 * before proceeding with launcher operations.
 */
const launcherProcedure = trcpProcedure.use(async ({ next }) => {
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

	return next({
		ctx: {
			activeAdapter,
		},
	});
});

/**
 * Helper function to handle tRPC errors consistently
 */
function handleTRPCError(error: any, defaultMessage: string, operation: string) {
	if (error instanceof TRPCError) {
		throw error;
	}

	console.error(`[LauncherRouter] Error ${operation}:`, error);
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: `${defaultMessage}: ${error.message}`,
	});
}

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
			let instances = [];

			// Get current adapter status
			const adapterStatus = await getAdapterStatus();

			// Get current instances if adapter is available
			if (isReady && activeAdapter) {
				try {
					instances = await activeAdapter.getInstances();
				} catch (error) {
					console.error("[LauncherRouter] Error getting instances for sync:", error);
				}
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
				adapterStatus: await getAdapterStatus(),
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
				const adapterStatus = await getAdapterStatus();

				return {
					isReady,
					activeAdapter: activeAdapter?.name || null,
					adapters: [adapterStatus],
				};
			} catch (error) {
				handleTRPCError(error, "Failed to get launcher status", "getting launcher status");
			}
		},
	),

	/**
	 * Stop all running instances managed by the active adapter
	 */
	stopAll: launcherProcedure.mutation(async ({ ctx }) => {
		try {
			const { activeAdapter } = ctx;

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
			handleTRPCError(error, "Failed to stop instances", "stopping all instances");
		}
	}),

	/**
	 * Launch a new stage instance for a show
	 */
	launch: launcherProcedure.input(LaunchRequestSchema).mutation(async ({ input, ctx }) => {
		try {
			const { activeAdapter } = ctx;

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
			handleTRPCError(error, "Failed to launch instance", "launching instance");
		}
	}),

	/**
	 * Stop a running instance
	 */
	stop: launcherProcedure.input(StopInstanceSchema).mutation(async ({ input, ctx }) => {
		try {
			const { activeAdapter } = ctx;

			// Stop the instance
			await activeAdapter.stop(input.instanceId);

			console.log(`[LauncherRouter] Successfully stopped instance '${input.instanceId}' using ${activeAdapter.name} adapter`);

			return {
				success: true,
				message: `Instance '${input.instanceId}' stopped successfully`,
			};
		} catch (error) {
			handleTRPCError(error, "Failed to stop instance", "stopping instance");
		}
	}),

	/**
	 * Get status of a specific instance
	 */
	getInstanceStatus: launcherProcedure.input(InstanceStatusSchema).query(async ({ input, ctx }) => {
		try {
			const { activeAdapter } = ctx;

			const status = await activeAdapter.getStatus(input.instanceId);

			return {
				instanceId: input.instanceId,
				status,
				adapterName: activeAdapter.name,
			};
		} catch (error) {
			handleTRPCError(error, "Failed to get instance status", "getting instance status");
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
			handleTRPCError(error, "Failed to get instances", "getting instances");
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
			handleTRPCError(error, "Failed to check launch capability", "checking launch capability");
		}
	}),
});

/** Launcher Router Type */
export type LauncherRouter = typeof launcherRouter;
