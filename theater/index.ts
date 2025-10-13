#!/usr/bin/env node

/**
 * Theater module entry point
 * A simple hello world application for the theater component
 */

/**
 * Main function that outputs hello world
 */
function main(): void {
	console.log("3 Hello World from Theater!");
}

// Execute main function when this file is run directly
// In ES modules, check if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { main };
