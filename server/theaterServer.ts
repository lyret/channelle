import { seedShows } from "./_seedDatabase";
import { sequelize, restify } from "./lib";
import { createAppRouter } from "./_router";

// Only launch this file when built for theater mode
if (!CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for stage mode.");
}

// Create the database connection
await sequelize();

// Seed the database with shows if needed
try {
	await seedShows();
} catch (error) {
	console.error("[Server] Failed to seed shows:", error);
	// Don't fail server startup, but log the error
}

// Create the app router
await createAppRouter();

// Create and start the http server
await restify();
