import * as Restify from "restify";
import { createTheaterServer } from "./_restify/createTheaterServer";
import { createStageServer } from "./_restify/createStageServer";
import { createNotUsedServer } from "./_restify/createNotUsedServer";
import { ipcServerEmitter } from "./_restify/_ipcMangement";
import type * as Http from "node:http";

let _restify: Restify.Server | undefined;

/** Returns the global restify server  */
export async function restify(): Promise<() => Restify.Server> {
	// Return already initialized singleton instance
	if (_restify) {
		return () => _restify;
	}

	// Create a new server dependent on the current mode
	if (CONFIG.runtime.theater) {
		_restify = await createTheaterServer();
	} else {
		_restify = await createStageServer();

		// Listen for server end events
		ipcServerEmitter.on("ended", async () => {
			await stopCurrentServer();
			_restify = await createNotUsedServer();
		});

		// Listen for server restart events
		ipcServerEmitter.on("restarted", async () => {
			await stopCurrentServer();
			_restify = await createStageServer();
		});
	}

	// Create the appropriate server using the server manager
	_restify.listen(CONFIG.web.port);
	console.log(`[Server] Restify listening on port ${CONFIG.web.port}`);

	return () => _restify;
}

/**
 * Stop the current running server
 */
async function stopCurrentServer(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (_restify) {
			console.log(`[Server] Stopping current HTTP server...`);
			_restify.close(() => {
				_restify = undefined;
				resolve();
			});
		} else {
			resolve();
		}
	});
}
