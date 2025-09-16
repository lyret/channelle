import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { trpc, ws } from "./lib";

/**
 * Creates and returns the application router
 */
export async function createAppRouter() {
	// Get the trcp router constructor
	const { router: trcpRouter } = trpc();

	// Create the sub-route configuration
	const { roomRouter } = await import("./routers/room");
	const routerConfig = {
		room: roomRouter,
	};

	// Add handling of incomming debugging messages from the cli
	if (CONFIG.runtime.debug) {
		const { debugRouter } = await import("./routers/debug");
		routerConfig["debug"] = debugRouter;
	}

	// Create the application router
	const appRouter = trcpRouter(routerConfig);

	// Create the websocket handler for the trpc server
	applyWSSHandler({
		wss: ws(),
		router: appRouter,
		createContext: (options) => {
			// Get the token from the connection parameters
			const token = options.info.connectionParams?.token;
			console.log("[TRPC] New Peer:", token);

			return {
				peer: {
					id: token, // Use the token as the peer id
				},
			};
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

	// Return the application trpc router
	return appRouter;
}
