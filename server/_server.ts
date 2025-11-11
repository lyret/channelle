import type * as Http from "http";
import { http, sequelize } from "./lib";
import { createAppRouter } from "./_router";
import { initializeStageWithShow } from "./lib/showConfigLoader";
import { initializeLauncher } from "./lib/launcher";

/**
 * Creates and starts the application server
 */
export async function createServer(): Promise<Http.Server> {
	// Create the http server
	const httpServer = await http();

	// Create the database connection
	await sequelize();

	// Initialize show configuration if showId is provided in stage mode
	if (!CONFIG.runtime.theater && CONFIG.stage.showId) {
		try {
			await initializeStageWithShow(CONFIG.stage.showId);
		} catch (error) {
			console.error(`[Server] Failed to initialize with show ID ${CONFIG.stage.showId}:`, error);
			// Don't fail server startup, but log the error
		}
	}

	// Initialize launcher system if in theater mode
	if (CONFIG.runtime.theater) {
		try {
			await initializeLauncher();
		} catch (error) {
			console.error("[Server] Failed to initialize launcher system:", error);
			// Don't fail server startup, but log the error
		}
	}

	// Create the app router
	await createAppRouter();

	// Start the server
	httpServer.listen(CONFIG.web.port);
	console.log(`[Http] Server listening on port ${CONFIG.web.port}`);

	// Return the http server
	return httpServer;
}
