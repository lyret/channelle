import { applyWSSHandler } from "@trpc/server/adapters/ws";
import type { Peer } from "./lib";
import { trpc, ws } from "./lib";
import { closeMediaPeer, mediaRouter } from "./routers/mediaRouter";
import { developmentRouter } from "./routers/developmentRouter";
import { chatRouter } from "./routers/chatRouter";
import { effectsRouter } from "./routers/effectsRouter";
import { showsRouter } from "./routers/showsRouter";
import { configRouter } from "./routers/configRouter";
import { theaterRouter, activeSessions as activeTheaterSessions } from "./routers/theaterRouter";
import { launcherRouter } from "./routers/launcherRouter";

/**
 * Creates and returns the application router
 */
export async function createAppRouter() {
	// Get the trcp router constructor
	const { router: trcpRouter } = trpc();

	// Create the sub-route configuration
	const routerConfig = {
		room: mediaRouter,
		development: developmentRouter,
		chat: chatRouter,
		effects: effectsRouter,
		shows: showsRouter,
		config: configRouter,
		theater: theaterRouter,
		launcher: launcherRouter,
	};

	// Remove handling of incomming development messages from the cli
	// when not developing
	if (CONFIG.isProduction) {
		delete routerConfig["development"];
	}

	// Create the application router
	const appRouter = trcpRouter(routerConfig);

	// Get the websocket server instance
	const wsServer = await ws();

	// Create the websocket handler for the trpc server
	applyWSSHandler({
		wss: wsServer,
		router: appRouter,
		createContext: ({ info, res }) => {
			// Get the peer id from the connection parameters
			const peerId = info.connectionParams?.peerId;
			console.log("[TRPC] Peer Connected:", peerId);
			res.once("close", () => {
				console.log("[TRPC] Peer Disconnected:", peerId);
				closeMediaPeer(peerId);
			});

			console.log("HERE", activeTheaterSessions.has(peerId), peerId, Array.from(activeTheaterSessions.keys()));
			return {
				peer: {
					// Use the given id as the peer id in the initial context, it will be updated in the authentication middleware when applied
					id: peerId,
					// Default the inital partial peer to being a manager if we are running in theather mode
					manager: activeTheaterSessions.has(peerId),
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
