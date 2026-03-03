import * as Restify from "restify";
import * as Fs from "node:fs/promises";
import * as Path from "node:path";

/**
 * Serves all static files from the build output folder
 */
export async function serveNotUsedFileOnly(server: Restify.Server): Promise<void> {
	let staticPath = Path.resolve(process.cwd(), CONFIG.build.interfaceOutput);
	let defaultEntryPoint = "notfound.html";

	// Serve all files in the output folder for static files
	server.get(
		"/*",
		Restify.plugins.serveStatic({
			directory: staticPath,
			maxAge: CONFIG.runtime.production ? 3600 : 0,
		}),
	);

	// Serve all html files in the appropriate output folder as paths without file extensions
	await Fs.readdir(staticPath).then((files) =>
		files
			.filter((file) => file.endsWith(".html"))
			.map((file) => [file, `/${file.split(".")[0]}`])
			.forEach(([file, url]) => {
				// Use the default entry point from config to determine root path mapping
				const defaultEntry = `/${defaultEntryPoint.split(".")[0]}`;
				if (url == defaultEntry) {
					server.get(
						"/",
						Restify.plugins.serveStatic({
							file: file,
							directory: staticPath,
							maxAge: CONFIG.runtime.production ? 3600 : 0,
						}),
					);
				}
				server.get(
					url,
					Restify.plugins.serveStatic({
						file: file,
						directory: staticPath,
						maxAge: CONFIG.runtime.production ? 3600 : 0,
					}),
				);
			}),
	);
}
