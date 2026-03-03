import * as Restify from "restify";
import { setupIpcEndpoints } from "./_setupIpcEndpoints";
import { serveStaticFiles } from "./_serveStaticFiles";

/**
 * Creates a stage server (for stage interface with IPC endpoints)
 */
export async function createStageServer(): Promise<Restify.Server> {
	console.log(`[Server] Creating stage server...`);

	// Create the server instance
	const restify = Restify.createServer();

	// Configure server options
	restify.use(
		Restify.plugins.bodyParser({
			mapParams: false,
			overrideParams: false,
		}),
	);

	// Parse query parameters
	restify.use(Restify.plugins.queryParser());

	// Compress responses on production
	if (CONFIG.runtime.production) {
		restify.use(Restify.plugins.gzipResponse());
	}

	// Disable all caching when debugging
	if (CONFIG.runtime.debug) {
		restify.use((req, res, next) => {
			res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
			res.setHeader("Pragma", "no-cache");
			res.setHeader("Expires", "0");
			res.setHeader("Surrogate-Control", "no-store");
			return next();
		});
	}

	// Add theater IPC API endpoints
	if (CONFIG.ipc.secret) {
		setupIpcEndpoints(restify);
	}

	// Serve static files
	await serveStaticFiles(restify);

	console.log(`[Server] Stage server created`);
	return restify;
}
