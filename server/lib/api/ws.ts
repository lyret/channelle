import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { roomRouter } from "../../room/room";

let _ws: WebSocketServer | undefined;

/** Returns the global web socket server  */
export function ws(): WebSocketServer {
	// Return already initialized singelton instance
	if (_ws) {
		return _ws;
	}

	// Create and return the socket server
	_ws = new WebSocketServer({
		port: 3001, // TODO: ADD PORT AND CONFIG TO GLOBAL CONGIG OBJECT
	});
	// TODO: ADD PORT AND CONFIG TO GLOBAL CONGIG OBJECT
	const handler = applyWSSHandler({
		wss: _ws,
		router: roomRouter,
		createContext: (options) => {
			const token = options.info.connectionParams?.token;
			console.log("[TRPC] Creating Context...", token);
			return {};
		},
		// Enable heartbeat messages to keep connection open (disabled by default)
		keepAlive: {
			enabled: true,
			// server ping message interval in milliseconds
			pingMs: 30000,
			// connection is terminated if pong message is not received in this many milliseconds
			pongWaitMs: 5000,
		},
	});

	_ws.on("connection", (ws) => {
		console.log(`➕➕ Connection (${_ws.clients.size})`);
		ws.once("close", () => {
			console.log(`➖➖ Connection (${_ws.clients.size})`);
		});
	});
	console.log("[WebSocket Server] Listening on ws://localhost:3001");
	process.on("SIGTERM", () => {
		console.log("[WebSocket Server] Closing and broadcasting reconnect notification...");
		handler.broadcastReconnectNotification();
		_ws.close();
		process.exit(0);
	});

	return _ws;
}
