import { applyWSSHandler } from "@trpc/server/adapters/ws";
import type { Peer } from "./lib";
import { trpc, ws } from "./lib";
import { closeMediaPeer, mediaRouter } from "./routers/mediaRouter";
import { developmentRouter } from "./routers/developmentRouter";
import { chatRouter } from "./routers/chatRouter";
import { effectsRouter } from "./routers/effectsRouter";
import { showsRouter } from "./routers/showsRouter";
import { configRouter } from "./routers/configRouter";
import { authRouter } from "./routers/authRouter";
import { launcherRouter } from "./routers/launcherRouter";
import { leave, userRouter } from "./routers/userRouter";

/**
 * Creates and returns the application router
 */
export async function createAppRouter() {
	// Get the trcp router constructor
	const { router: trcpRouter } = trpc();

	// Create the sub-route configuration
	const routerConfig = {
		development: developmentRouter,
		config: configRouter,
		users: userRouter,
		auth: authRouter,
		shows: showsRouter,
		launchers: launcherRouter,
		chat: chatRouter,
		media: mediaRouter,
		effects: effectsRouter,
	};

	// Remove handling of incomming development messages from the cli
	// when not developing
	if (CONFIG.runtime.production) {
		delete routerConfig["development"];
	}

	// Remove the theater mode only routers
	// when running as a stage and vice versa
	if (CONFIG.runtime.theater) {
		delete routerConfig["media"];
		delete routerConfig["effects"];
	} else {
		// delete routerConfig["shows"]; TODO: needed?
		delete routerConfig["launchers"];
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
				leave(peerId);
			});

			return {
				peer: {
					// Use the given id as the peer id in the initial context, it will be updated in the authentication middleware when applied
					id: peerId,
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
