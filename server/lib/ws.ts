import { WebSocketServer } from "ws";
import { restify } from "./restify";

let _ws: WebSocketServer | undefined;

/** Returns the global web socket server  */
export async function ws(): Promise<WebSocketServer> {
	// Return already initialized singelton instance
	if (_ws) {
		return _ws;
	}

	// Get the http server
	const httpServer = (await restify())().server;

	// Create and return the socket server
	_ws = new WebSocketServer({
		server: httpServer,
	});

	if (CONFIG.runtime.verbose) {
		_ws.on("connection", (ws) => {
			console.log(`[WS] +Connections (${_ws.clients.size})`);
			ws.once("close", () => {
				console.log(`[WS] -Connections (${_ws.clients.size})`);
			});
		});
	}
	console.log(`[WS] Listening on port ${CONFIG.runtime.port}`);

	return _ws;
}
