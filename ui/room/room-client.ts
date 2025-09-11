import type { inferRouterInputs, inferRouterOutputs, inferRouterContext } from "@trpc/server";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import type { RoomRouter } from "../../server/room";

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: "ws://localhost:3001",
	connectionParams: async () => {
		// Simple uuid generator
		const uuidv4 = "111-111-1111".replace(/[018]/g, () => (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16));

		return {
			token: uuidv4,
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
