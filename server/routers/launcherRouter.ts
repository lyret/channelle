import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { Show } from "../models/Show";
import { Launch } from "../models/Launch";
import { getActiveAdapter, isLauncherReady, getAdapterStatus } from "../launchers";
import type { AdapterStatus } from "../launchers/types";
import { Op } from "sequelize";

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
const StopLaunchSchema = z.object({
	launchId: z.number().int().positive("Launch ID is required"),
});

/**
 * Launch status request validation
 */
const LaunchStatusSchema = z.object({
	launchId: z.number().int().positive("Launch ID is required"),
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

			// Get current launches from database
			if (isReady) {
				try {
					instances = await Launch.findAll({
						order: [["createdAt", "DESC"]],
					});
				} catch (error) {
					console.error("[LauncherRouter] Error getting launches for sync:", error);
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
	getSystemStatus: trcpProcedure.query(
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
	 * Stop all running launches
	 */
	stopAll: launcherProcedure.mutation(async ({ ctx }) => {
		try {
			const { activeAdapter } = ctx;

			// Get all running launches from database
			const runningLaunches = await Launch.findAll({
				where: {
					status: {
						[Op.in]: ["running", "starting"],
					},
				},
			});

			if (runningLaunches.length === 0) {
				return {
					success: true,
					message: "No running launches to stop",
					stoppedCount: 0,
				};
			}

			// Stop all instances and update launch records
			const stopPromises = runningLaunches.map(async (launch) => {
				try {
					await activeAdapter.stop(launch.instanceId);
				} catch (stopError) {
					// If the instance is not found, consider it successfully stopped
					if (!stopError.message.includes("not found") && !stopError.message.includes("Not found")) {
						console.error(`[LauncherRouter] Error stopping launch '${launch.id}' (instance: '${launch.instanceId}'):`, stopError);
						return { launchId: launch.id, error: stopError.message };
					}
					// If not found, continue to mark as stopped
				}

				// Update the launch record (whether we successfully stopped or it was not found)
				await launch.update({
					status: "stopped",
					stoppedAt: new Date(),
				});
				return { launchId: launch.id, success: true };
			});

			await Promise.all(stopPromises);

			console.log(`[LauncherRouter] Stopped ${runningLaunches.length} launches using ${activeAdapter.name} adapter`);

			return {
				success: true,
				message: `Stopped ${runningLaunches.length} launches`,
				stoppedCount: runningLaunches.length,
			};
		} catch (error) {
			handleTRPCError(error, "Failed to stop launches", "stopping all launches");
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

			// Create Launch record in database to track this launch
			const launch = await Launch.create({
				instanceId: launchResult.instanceId,
				showId: show.id,
				url: launchResult.url,
				port: launchResult.port,
				status: launchResult.status,
				stoppedAt: null,
			});

			console.log(
				`[LauncherRouter] Successfully launched instance '${launchResult.instanceId}' for show '${show.name}' using ${activeAdapter.name} adapter`,
			);

			return {
				success: true,
				launchId: launch.id,
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
	 * Stop a running launch
	 */
	stop: launcherProcedure.input(StopLaunchSchema).mutation(async ({ input, ctx }) => {
		try {
			const { activeAdapter } = ctx;

			// Find the launch record
			const launch = await Launch.findByPk(input.launchId);
			if (!launch) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Launch not found",
				});
			}

			// Stop the instance using the instanceId from the launch record
			try {
				await activeAdapter.stop(launch.instanceId);
			} catch (stopError) {
				// If the instance is not found, consider it successfully stopped
				if (stopError.message.includes("not found") || stopError.message.includes("Not found")) {
					console.log(`[LauncherRouter] Instance '${launch.instanceId}' not found - considering it stopped`);
				} else {
					// Re-throw other types of errors
					throw stopError;
				}
			}

			// Update the launch record
			await launch.update({
				status: "stopped",
				stoppedAt: new Date(),
			});

			console.log(
				`[LauncherRouter] Successfully stopped launch '${input.launchId}' (instance: '${launch.instanceId}') using ${activeAdapter.name} adapter`,
			);

			return {
				success: true,
				message: `Launch '${input.launchId}' stopped successfully`,
			};
		} catch (error) {
			handleTRPCError(error, "Failed to stop launch", "stopping launch");
		}
	}),

	/**
	 * Get status of a specific launch
	 */
	getInstanceStatus: launcherProcedure.input(LaunchStatusSchema).query(async ({ input, ctx }) => {
		try {
			const { activeAdapter } = ctx;

			// Find the launch record
			const launch = await Launch.findByPk(input.launchId);
			if (!launch) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Launch not found",
				});
			}

			const status = await activeAdapter.getStatus(launch.instanceId);

			return {
				launchId: input.launchId,
				instanceId: launch.instanceId,
				status,
				adapterName: activeAdapter.name,
			};
		} catch (error) {
			handleTRPCError(error, "Failed to get launch status", "getting launch status");
		}
	}),

	/**
	 * Get all launches from the database
	 */
	getInstances: trcpProcedure.query(async () => {
		try {
			// Get all launch records from database
			const launches = await Launch.findAll({
				order: [["createdAt", "DESC"]],
			});

			return {
				instances: launches,
				adapterName: null, // We don't track adapter per launch currently
			};
		} catch (error) {
			handleTRPCError(error, "Failed to get launches", "getting launches");
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
