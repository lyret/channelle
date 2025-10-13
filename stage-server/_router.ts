import { applyWSSHandler } from "@trpc/server/adapters/ws";
import type { Peer } from "./lib";
import { trpc, ws } from "./lib";
import { closePeer, roomRouter } from "./routers/roomRouter";
import { developmentRouter } from "./routers/development";
import { chatRouter } from "./routers/chatRouter";
import { effectsRouter } from "./routers/effectsRouter";

/**
 * Creates and returns the application router
 */
export async function createAppRouter() {
	// Get the trcp router constructor
	const { router: trcpRouter } = trpc();

	// Create the sub-route configuration
	const routerConfig = {
		room: roomRouter,
		development: developmentRouter,
		chat: chatRouter,
		effects: effectsRouter,
	};

	// Remove handling of incomming development messages from the cli
	// when not developing
	if (CONFIG.isProduction) {
		delete routerConfig["development"];
	}

	// Create the application router
	const appRouter = trcpRouter(routerConfig);

	// Create the websocket handler for the trpc server
	applyWSSHandler({
		wss: ws(),
		router: appRouter,
		createContext: ({ info, res }) => {
			// Get the peer id from the connection parameters
			const peerId = info.connectionParams?.peerId;
			console.log("[TRPC] Peer Connected:", peerId);
			res.once("close", () => {
				console.log("[TRPC] Peer Disconnected:", peerId);
				closePeer(peerId);
			});
			//consooptions.info

			return {
				peer: {
					id: peerId, // Use the given id as the peer id in the initial context, it will be updated in the authentication middleware when applied
				} as Peer,
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
