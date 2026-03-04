import { z } from "zod";
import { trpc } from "../lib";
import { authenticatedAdminProcedure } from "./authRouter";
import { History } from "../models/History";

// Get the trpc router constructor and default procedure
const { router } = trpc();

/**
 * History Router - Handles history operations
 */
export const historyRouter = router({
	/**
	 * Get all history records
	 */
	getAll: authenticatedAdminProcedure.query(async () => {
		try {
			const histories = await History.findAll({
				order: [["endedAt", "DESC"]], // Most recent first
			});
			return histories;
		} catch (error) {
			console.error("Error fetching history records:", error);
			throw new Error("Failed to fetch history records");
		}
	}),

	/**
	 * Get history records for a specific show
	 */
	getByShow: authenticatedAdminProcedure
		.input(
			z.object({
				showId: z.number().int().positive(),
			}),
		)
		.query(async ({ input }) => {
			try {
				const histories = await History.findAll({
					where: { showId: input.showId },
					order: [["endedAt", "DESC"]], // Most recent first
				});
				return histories;
			} catch (error) {
				console.error(`Error fetching history for show ${input.showId}:`, error);
				throw new Error("Failed to fetch history records");
			}
		}),
});

/** History Router Type */
export type HistoryRouter = typeof historyRouter;
