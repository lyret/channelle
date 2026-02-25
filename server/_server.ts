import type * as Http from "http";
import { http, sequelize } from "./lib";
import { createAppRouter } from "./_router";
import { getRedbirdProxy } from "./lib/redbirdProxy";

/**
 * Creates and starts the application server
 */
export async function createServer(): Promise<Http.Server> {
	// Create the http server
	const httpServer = await http();

	// Create the database connection
	await sequelize();

	// Create the app router
	await createAppRouter();

	// Initialize a local proxy server if configured in the local launcher
	if (CONFIG.launcher?.local?.proxyPort) {
		try {
			const redbirdProxy = getRedbirdProxy();
			await redbirdProxy.initialize();
			console.log(`[Proxy] Ready on port ${CONFIG.launcher.local.proxyPort}`);
		} catch (error) {
			console.error("[Proxy] Failed to initialize:", error);
			// Don't fail server startup if proxy fails
		}
	}

	// Start the server
	httpServer.listen(CONFIG.web.port);
	console.log(`[Http] Server listening on port ${CONFIG.web.port}`);

	// Return the http server
	return httpServer;
}
