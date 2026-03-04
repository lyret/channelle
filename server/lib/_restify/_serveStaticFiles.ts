import * as Restify from "restify";
import * as Fs from "node:fs/promises";
import * as Path from "node:path";
import { getNotFoundTemplate } from "./_templateForNotFound";

/**
 * Serves all static files from the build output folder
 */
export async function serveStaticFiles(server: Restify.Server): Promise<void> {
	let staticPath = Path.resolve(process.cwd(), CONFIG.build.interfaceOutput);
	let defaultEntryPoint = CONFIG.build.defaultInterfaceEntryPoint;

	// Serve all files in the output folder for static files
	server.get(
		"/*",
		Restify.plugins.serveStatic({
			directory: staticPath,
			maxAge: CONFIG.runtime.production ? 3600 : 0,
		}),
	);

	// Handle not found files
	server.on("NotFound", (req, res, error, next) => {
		res.setHeader("Content-Type", "text/html");
		error.statusCode = 404;
		error.toString = function customToJSON() {
			return getNotFoundTemplate();
		};
		next();
	});
}
