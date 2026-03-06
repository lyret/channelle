import type { Peer } from "./models/Peer";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { trpc, ws } from "./lib";
import { closeMediaPeer, stageRouter } from "./routers/stageRouter";
import { developmentRouter } from "./routers/developmentRouter";
import { chatRouter } from "./routers/chatRouter";
import { effectsRouter } from "./routers/effectsRouter";
import { showsRouter } from "./routers/showsRouter";
import { backstageRouter } from "./routers/backstageRouter";
import { authRouter, deauthenticate } from "./routers/authRouter";
import { peersRouter } from "./routers/peersRouter";
import { theaterRouter } from "./routers/theaterRouter";
import { historyRouter } from "./routers/historyRouter";

/**
 * Creates and returns the application router
 */
export async function createAppRouter() {
	// Get the trcp router constructor
	const { router: trcpRouter } = trpc();

	// Create the sub-route configuration
	const routerConfig = {
		development: developmentRouter,
		backstage: backstageRouter,
		auth: authRouter,
		peers: peersRouter,
		shows: showsRouter,
		chat: chatRouter,
		media: stageRouter,
		effects: effectsRouter,
		theater: theaterRouter,
		history: historyRouter,
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
		delete routerConfig["theater"];
	}

	// Create the application router
	const appRouter = trcpRouter(routerConfig);

	// Get the websocket server instance
	const wsServer = await ws();

	// Create the websocket handler for the trpc server
	applyWSSHandler({
		wss: wsServer,
		router: appRouter,
		createContext: async ({ info, res }) => {
			// Get the given connection details from the connection parameters
			const peerId = info.connectionParams?.peerId;
			const connectionId = info.connectionParams?.connectionId;
			const deviceType = info.connectionParams?.deviceType || "unknown";
			const routeType = info.connectionParams?.routeType || "unknown";

			// Reject connections without a peer ID
			if (!peerId) {
				console.log("[TRPC] Connection rejected: No peer ID provided");
				res.close();
				throw new Error("Connection requires a peer ID");
			}
			// Reject connections without a connection ID
			if (!connectionId) {
				console.log("[TRPC] Connection rejected: No connection ID provided");
				res.close();
				throw new Error("Connection requires a connectionId ID");
			}

			// Output that connection has been established
			console.log(`[TRPC] Peer ${peerId} Connected (id: ${connectionId}, route: ${routeType}, device: ${deviceType})`);

			res.once("close", () => {
				console.log(`[TRPC] Peer ${peerId} Disconnected (id: ${connectionId}, route: ${routeType})`);

				// Remove this connection when the websocket closes
				const isOffline = deauthenticate(connectionId, routeType, peerId);

				// If the user turned offline then also close its media peers
				if (isOffline) {
					closeMediaPeer(peerId);
				}
			});

			return {
				peer: {
					// Use the given id as the peer id in the initial context, it will be updated in the authentication middleware when applied
					id: peerId,
				} as Peer,
				connection: {
					id: info.connectionParams?.connectionId,
					routeType: routeType,
					deviceType: info.connectionParams?.deviceType,
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
