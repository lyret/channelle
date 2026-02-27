import type * as Http from "http";
import { http, sequelize } from "./lib";
import { createAppRouter } from "./_router";

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

	// Start the server
	httpServer.listen(CONFIG.web.port);
	console.log(`[Http] Server listening on port ${CONFIG.web.port}`);

	// Return the http server
	return httpServer;
}
