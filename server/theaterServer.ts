import { createServer } from "./_server";
import { seedShows } from "./_seedDatabase";
import { Show } from "./models/Show";
import { Launch } from "./models/Launch";

// Only launch this file when built for theater mode
if (!CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for stage mode.");
}

// Starts the server when this file is executed
await createServer();

// Seed the database with shows if needed
try {
	await seedShows();
} catch (error) {
	console.error("[Server] Failed to seed shows:", error);
	// Don't fail server startup, but log the error
}
