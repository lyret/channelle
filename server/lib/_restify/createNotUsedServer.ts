import * as Restify from "restify";
import { setupIpcEndpoints } from "./_setupIpcEndpoints";
import { serveNotUsedFileOnly } from "./_serveNotUsedFileOnly";

/**
 * Creates a not-used server (stage server in not-used mode)
 */
export async function createNotUsedServer(): Promise<Restify.Server> {
	console.log(`[Server] Creating not-used server...`);

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

	// Always redirect non-api request to notFound in not-used mode
	restify.use((req, res, next) => {
		// Check if this is a theater IPC request (should always be allowed)
		if (req.url.startsWith("/api/theater/")) {
			return next();
		}
		if (req.url.startsWith("/stage")) {
			return res.redirect(301, "/notfound", next);
		}
		if (req.url.startsWith("/backstage")) {
			return res.redirect(301, "/notfound", next);
		}
		console.log(`[Not-Used Server] Redirecting request to notfound: ${req.url}`);
		return next();
	});

	// Serve static files - but default to notFound.html
	await serveNotUsedFileOnly(restify);

	console.log(`[Server] Not-used server created`);
	return restify;
}
