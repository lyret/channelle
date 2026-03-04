import { trpc } from "../lib";
import { z } from "zod";
import { authenticatedAdminProcedure } from "./authRouter";
import type { IpcStatus } from "../_types";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/**
 * Theater Router - Handles theater mode operations for managing stage servers
 */
export const theaterRouter = trcpRouter({
	/**
	 * Get the current status of the stage server
	 */
	status: trcpProcedure.query(async (): Promise<IpcStatus> => {
		try {
			const response = await fetch(`${CONFIG.ipc.stageUrl}/api/theater/status?secret=${CONFIG.ipc.secret}`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const result = await response.json();
			return result;
		} catch (error) {
			console.error("[Theater] Error fetching status:", error);
			throw new Error("Failed to fetch stage server status");
		}
	}),

	/**
	 * End the current show on the stage server
	 */
	end: authenticatedAdminProcedure.mutation(async (): Promise<{ end: true }> => {
		try {
			const response = await fetch(`${CONFIG.ipc.stageUrl}/api/theater/end`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${CONFIG.ipc.secret}`,
				},
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const result = await response.json();
			return result;
		} catch (error) {
			console.error("[Theater] Error ending show:", error);
			throw new Error("Failed to end current show");
		}
	}),

	/**
	 * Start or restart a show on the stage server
	 */
	start: authenticatedAdminProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }): Promise<{ rebuild: boolean | undefined }> => {
			try {
				const response = await fetch(`${CONFIG.ipc.stageUrl}/api/theater/start`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${CONFIG.ipc.secret}`,
					},
					body: JSON.stringify({ showId: input.showId }),
				});
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const result = await response.json();
				return result;
			} catch (error) {
				console.error("[Theater] Error starting show:", error);
				throw new Error("Failed to start show");
			}
		}),
});

/** Theater Router Type */
export type TheaterRouter = typeof theaterRouter;
