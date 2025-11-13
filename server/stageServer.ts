import { loadShowConfiguration } from "./_loadShowData";
import { createServer } from "./_server";

// Only launch this file when built for stage mode
if (CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for theater mode.");
}

// Initialize show configuration if showId is provided
if (CONFIG.stage.showId) {
	try {
		await loadShowConfiguration(CONFIG.stage.showId);
	} catch (error) {
		console.error(`[Server] Failed to initialize with show ID ${CONFIG.stage.showId}:`, error);
		// Don't fail server startup, but log the error
	}
}

// Starts the server when this file is executed
createServer();
