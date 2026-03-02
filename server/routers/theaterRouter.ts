import { z } from "zod";
import { trpc } from "../lib";
import { handleHealthCheck, handleRebuild, handleNotUsedMode, getServerState, isServerActive } from "../stageServerState";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Theater Router - Handles theater-specific API endpoints for stage server management
 */
export const theaterRouter = trcpRouter({
	/**
	 * Get the current health status of the stage server
	 */
	health: trcpProcedure.query(async () => {
		return getServerState();
	}),

	/**
	 * Get detailed health information including start time and show info
	 */
	healthCheck: trcpProcedure.query(async () => {
		const healthInfo = {
			status: isServerActive() ? "running" : "stopped",
			startTime: getServerState().startTime,
			currentShowId: getServerState().currentShowId,
			currentShowName: getServerState().currentShowName,
			currentShowUrlPath: getServerState().currentShowUrlPath,
			isActive: isServerActive(),
		};

		console.log(`[TheaterRouter] Status check returned: ${healthInfo.status}`);
		return healthInfo;
	}),

	/**
	 * Legacy health check endpoint for backward compatibility
	 * Returns "healthy" or "unhealthy" status
	 */
	legacyHealth: trcpProcedure.query(async () => {
		const legacyHealthInfo = {
			status: isServerActive() ? "healthy" : "unhealthy",
			startTime: getServerState().startTime,
			currentShowId: getServerState().currentShowId,
			currentShowName: getServerState().currentShowName,
			currentShowUrlPath: getServerState().currentShowUrlPath,
			isActive: isServerActive(),
		};

		console.log(`[TheaterRouter] Legacy health check returned: ${legacyHealthInfo.status}`);
		return legacyHealthInfo;
	}),

	/**
	 * Rebuild the stage server with new show configuration
	 */
	rebuild: trcpProcedure
		.input(
			z.object({
				showId: z.number(),
				showName: z.string(),
				showUrlPath: z.string(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const result = await handleRebuild({ body: input } as any, { json: (data: any) => data } as any);
				return result;
			} catch (error: any) {
				console.error(`[TheaterRouter] Rebuild failed:`, error);
				throw new Error(error.message || "Failed to rebuild server");
			}
		}),

	/**
	 * Enable/disable not-used mode for the stage server
	 */
	notUsedMode: trcpProcedure
		.input(
			z.object({
				enable: z.boolean(),
			}),
		)
		.mutation(async ({ input }) => {
			try {
				const result = await handleNotUsedMode({ body: input } as any, { json: (data: any) => data } as any);
				return result;
			} catch (error: any) {
				console.error(`[TheaterRouter] Not-used mode change failed:`, error);
				throw new Error(error.message || "Failed to change not-used mode");
			}
		}),
});

/**
 * Theater Router Type
 */
export type TheaterRouter = typeof theaterRouter;
