import { Show } from "./models/Show";

/**
 * Load show configuration from the database by the given show id
 * This function is called during server startup when --showId is provided.
 */
export async function loadShowConfiguration(showId: number): Promise<void> {
	try {
		if (CONFIG.runtime.debug) {
			console.log(`[Show Data] Loading show configuration from database entry with id: ${showId}...`);
		}

		const show = await Show.findByPk(showId);

		if (!show) {
			throw new Error(`Show with id ${showId} not found`);
		}

		console.log(`[Show Data] Successfully loaded show: ${show.name}`);

		if (CONFIG.runtime.debug) {
			console.log("[Show Data] Show configuration summary:");
			Object.entries(show.toJSON()).forEach(([key, value]) => {
				console.log(` - ${key}: ${value}`);
			});
		}

		// Store the loaded show globally for access by other parts of the application
		global.STAGE_SHOW_CONFIG = show.toJSON();
	} catch (error) {
		console.error("[Show Data] Error loading show configuration:", error);
		throw error;
	}
}

/**
 * Get the currently loaded show configuration
 * Returns null if no show is loaded (e.g., stage mode without --showId)
 */
export function getCurrentShowData(): any | null {
	return global.STAGE_SHOW_CONFIG || null;
}

/**
 * Check if stage is running with a specific show configuration
 */
export function isStageRunningWithShow(): boolean {
	return Boolean(global.STAGE_SHOW_CONFIG);
}
