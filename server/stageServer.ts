import { loadBackstageConfigurationFromRuntime } from "./_globalBackstageData";
import { createServer } from "./_server";

// Only launch this file when built for stage mode
if (CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for theater mode.");
}

// Starts the server when this file is executed
await createServer();

// Initialize the backstage configuration
try {
	await loadBackstageConfigurationFromRuntime();
} catch (error) {
	console.error(`[Server] Failed to initialize with show ID ${CONFIG.backstage.showId}:`, error);
	// Don't fail server startup, but log the error
}
