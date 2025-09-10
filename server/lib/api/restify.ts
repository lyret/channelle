import * as restifyLib from "restify";
import * as Fs from "fs/promises";
import * as Path from "path";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { roomRouter } from "../../room/room";

let _restify: restifyLib.Server | undefined;

/** Returns the global restify server  */
export function restify(): restifyLib.Server {
	// Return already initialized singleton instance
	if (_restify) {
		return _restify;
	}

	// Create and return the server instance
	_restify = restifyLib.createServer();

	// Configure server options
	_restify.use(
		restifyLib.plugins.bodyParser({
			mapParams: false,
			overrideParams: false,
		}),
	);
	_restify.use(restifyLib.plugins.queryParser());
	_restify.use(restifyLib.plugins.gzipResponse());

	// Serve static files
	const staticPath = Path.resolve(process.cwd(), CONFIG.build.clientOutput);
	_restify.get(
		"/*",
		restifyLib.plugins.serveStatic({
			directory: staticPath,
			maxAge: 0,
		}),
	);

	// Serve trpc communication
	const innerHandler = createHTTPHandler({
		router: roomRouter,
		basePath: "/room/",
		createContext() {
			console.log("HERE");
			return {};
		},
	});
	async function trpcHandler(req: restifyLib.Request, res: restifyLib.Response) {
		return innerHandler(req, res);
	}
	_restify.post("/room/*", trpcHandler);
	_restify.put("/room/*", trpcHandler);
	_restify.get("/room/*", trpcHandler);
	_restify.head("/room/*", trpcHandler);
	_restify.del("/room/*", trpcHandler);

	// Serve the client interface for some specific routes
	const clientInterfaceHandler = async (req: restifyLib.Request, res: restifyLib.Response) => {
		try {
			const outFile = await Fs.readFile(Path.resolve(process.cwd(), CONFIG.build.clientOutput, "index.html"), {
				encoding: "utf8",
			});
			// outFile = outFile.replaceAll('_main', '/_main');
			// outFile = outFile.replaceAll('style.css', '/style.css');

			res.contentType = "text/html";
			res.sendRaw(200, outFile);
		} catch (error) {
			req.log.error("Failed to serve client interface");
			req.log.error(error);
			res.sendRaw(500, "Internal Server Error");
		}
	};
	_restify.get("/stage", clientInterfaceHandler);
	_restify.get("/backstage", clientInterfaceHandler);
	_restify.get("/debug", clientInterfaceHandler);
	_restify.get("/", clientInterfaceHandler);

	return _restify;
}
