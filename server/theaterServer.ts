import { initializeAllLaunchers } from "./launchers";
import { createServer } from "./_server";
import { seedShows } from "./_seedDatabase";

// Only launch this file when built for theater mode
if (!CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for stage mode.");
}

// Initialize all server launchers
try {
	await initializeAllLaunchers();
} catch (error) {
	console.error("[Server] Failed to initialize launchers:", error);
	// Don't fail server startup, but log the error
}

// Seed the database with shows if needed
try {
	await seedShows();
} catch (error) {
	console.error("[Server] Failed to seed shows:", error);
	// Don't fail server startup, but log the error
}

// Starts the server when this file is executed
createServer();
