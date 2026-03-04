import * as Restify from "restify";
import { setupIpcEndpoints } from "./_setupIpcEndpoints";
import { serveNonActiveTemplateOnly } from "./_serveNonActiveTemplateOnly";
import { serveStaticFiles } from "./_serveStaticFiles";

/**
 * Creates a not-used server (stage server in not-used mode)
 */
export async function createNotUsedServer(): Promise<Restify.Server> {
	console.log(`[Server] Creating not-used server...`);

	// Create the server instance
	const restify = Restify.createServer({
		formatters: {
			"text/html": function (req, res, body) {
				return body.toString();
			},
		},
	});

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

	// Return get requests to the non active server template
	await serveNonActiveTemplateOnly(restify);

	// Serve static files
	await serveStaticFiles(restify);

	console.log(`[Server] Not-used server created`);
	return restify;
}
