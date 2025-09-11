import * as Restify from "restify";
import * as Fs from "node:fs/promises";
import * as Path from "node:path";

let _restify: Restify.Server | undefined;

/** Returns the global restify server  */
export async function restify(): Promise<Restify.Server> {
	// Return already initialized singleton instance
	if (_restify) {
		return _restify;
	}

	// Create and return the server instance
	_restify = Restify.createServer();

	// Configure server options
	_restify.use(
		Restify.plugins.bodyParser({
			mapParams: false,
			overrideParams: false,
		}),
	);
	_restify.use(Restify.plugins.queryParser());
	_restify.use(Restify.plugins.gzipResponse());

	// Serve static files
	const staticPath = Path.resolve(process.cwd(), CONFIG.build.clientOutput);
	_restify.get(
		"/*",
		Restify.plugins.serveStatic({
			directory: staticPath,
			maxAge: CONFIG.isProduction ? 3600 : 0,
		}),
	);

	// Serve all html files in the ui output folder as paths without file extensions
	await Fs.readdir(staticPath).then((files) =>
		files
			.filter((file) => file.endsWith(".html"))
			.map((file) => [file, `/${file.split(".")[0]}`])
			.forEach(([file, url]) => {
				_restify.get(
					url == "/index" ? "/" : url,
					Restify.plugins.serveStatic({
						file: file,
						directory: staticPath,
						maxAge: CONFIG.isProduction ? 3600 : 0,
					}),
				);
			}),
	);

	return _restify;
}
