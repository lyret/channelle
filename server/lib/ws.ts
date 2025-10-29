import { WebSocketServer } from "ws";

let _ws: WebSocketServer | undefined;

/** Returns the global web socket server  */
export function ws(): WebSocketServer {
	// Return already initialized singelton instance
	if (_ws) {
		return _ws;
	}

	// Create and return the socket server
	_ws = new WebSocketServer({
		port: CONFIG.socket.port,
	});

	if (CONFIG.runtime.debug) {
		_ws.on("connection", (ws) => {
			console.log(`[WS] +Connections (${_ws.clients.size})`);
			ws.once("close", () => {
				console.log(`[WS] -Connections (${_ws.clients.size})`);
			});
		});
	}
	console.log("[WS] Listening on ws://localhost:3001");

	return _ws;
}
