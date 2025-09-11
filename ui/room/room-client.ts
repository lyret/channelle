import type { inferRouterInputs, inferRouterOutputs, inferRouterContext } from "@trpc/server";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import type { RoomRouter } from "../../server/room";

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: "ws://localhost:3001",
	connectionParams: async () => {
		return {
			token: "supersecret" + Math.floor(Math.random() * 1000),
		};
	},
});

/** Create a TRPC client for the room API  */
export const roomClient = createTRPCClient<RoomRouter>({
	links: [
		wsLink({
			client: wsClient,
		}),
	],
});

export type RoomRouterContext = inferRouterContext<RoomRouter>;
export type RoomRouterInput = inferRouterInputs<RoomRouter>;
export type RoomRouterOutput = inferRouterOutputs<RoomRouter>;
export type RoomRouterPath = keyof RoomRouter;
