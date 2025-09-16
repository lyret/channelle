import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { trpc, ws } from "./lib";
import { roomRouter } from "./routers/room";
import { debugRouter } from "./routers/debug";

/**
 * Creates and returns the application router
 */
export async function createAppRouter() {
	// Get the trcp router constructor
	const { router: trcpRouter } = trpc();

	// Create the sub-route configuration
	const routerConfig = {
		room: roomRouter,
		debug: debugRouter,
	};

	// Remove handling of incomming debugging messages from the cli
	// when not debugging
	if (!CONFIG.runtime.debug) {
		delete routerConfig["debug"];
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

/** The Application TRPC Router */
export type AppRouter = Awaited<ReturnType<typeof createAppRouter>>;
