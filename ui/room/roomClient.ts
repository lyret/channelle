import type { inferRouterInputs, inferRouterOutputs, inferRouterContext } from "@trpc/server";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import type { RoomRouter } from "./types";

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: "ws://localhost:3001", // TODO: Move to CONFIG
	connectionParams: async () => {
		// Generate a random UUIDv4 token
		const uuidv4 = "111-111-1111".replace(/[018]/g, () => (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16));

		// Connect to the TRPC server using these connection parameters
		return {
			token: uuidv4,
		};
	},
});

/** The TRPC client for the Room API  */
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
