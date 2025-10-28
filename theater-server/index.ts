#!/usr/bin/env node

import * as http from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Theater Server with integrated web server for theater-interface
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Simple web server for serving theater-interface files
 */
async function createWebServer(): Promise<http.Server> {
	const server = http.createServer(async (req, res) => {
		try {
			// Get the requested path, default to index.html
			let filePath = req.url === "/" ? "/index.html" : req.url || "/index.html";

			// Remove query parameters
			filePath = filePath.split("?")[0];

			// Build the full path to the theater-interface files
			const fullPath = path.join(__dirname, "..", "theater-interface", filePath);

			// Try to read the file
			const data = await fs.readFile(fullPath);

			// Set content type based on file extension
			const ext = path.extname(filePath).toLowerCase();
			let contentType = "text/html";
			switch (ext) {
				case ".js":
					contentType = "application/javascript";
					break;
				case ".css":
					contentType = "text/css";
					break;
				case ".png":
					contentType = "image/png";
					break;
				case ".jpg":
				case ".jpeg":
					contentType = "image/jpeg";
					break;
				case ".gif":
					contentType = "image/gif";
					break;
				case ".svg":
					contentType = "image/svg+xml";
					break;
				case ".json":
					contentType = "application/json";
					break;
			}

			res.writeHead(200, { "Content-Type": contentType });
			res.end(data);
		} catch (error) {
			// File not found or other error
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("404 Not Found");
		}
	});

	return server;
}

/**
 * Main function that starts the theater server
 */
async function main(): Promise<void> {
	console.log("🎭 Theater Server starting...\n");

	// Create and start the web server
	const server = await createWebServer();
	const port = CONFIG.runtime.port;

	server.listen(port, () => {
		console.log(`[THEATER] Interface available at: http://localhost:${port}`);
	});

	// Handle graceful shutdown
	process.on("SIGTERM", () => {
		console.log("[THEATER] Server shutting down...");
		server.close(() => {
			process.exit(0);
		});
	});
}

// Execute main function when this file is run directly
// In ES modules, check if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error("❌ Theater Server error:", error);
		process.exit(1);
	});
}

export { main };
