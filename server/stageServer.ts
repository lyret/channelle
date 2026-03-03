import { loadBackstageConfigurationFromRuntime } from "./_globalBackstageData";
import { sequelize, restify } from "./lib";
import { createAppRouter } from "./_router";

// Only launch this file when built for stage mode
if (CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for theater mode.");
}

// Initialize the backstage configuration
try {
	await loadBackstageConfigurationFromRuntime();
} catch (error) {
	console.error(`[Server] Failed to initialize with show ID ${CONFIG.backstage.showId}:`, error);
	// Don't fail server startup, but log the error
}

// Create the database connection
await sequelize();

// Create the app router
await createAppRouter();

// Create and start the http server
await restify();
