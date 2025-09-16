import type { AppRouter } from "../../server/_types";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: "ws://localhost:3001", // FIXME: Make the websocket connection use the most appropiate url and make sure the port is mapped when deployed
	connectionParams: async () => {
		// Generate a random UUIDv4 token
		const uuidv4 = "111-111-1111".replace(/[018]/g, () => (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16));

		// Connect to the TRPC server using these connection parameters
		return {
			token: uuidv4,
		};
	},
	onOpen: () => {
		console.log("WebSocket connection opened");
	},
	onClose: () => {
		console.log("WebSocket connection closed");
	},
});

/** The TRPC client for the Room API  */
export const appClient = createTRPCClient<AppRouter>({
	links: [
		wsLink({
			client: wsClient,
		}),
	],
});

/** Client for the Room API only */
export const roomClient = appClient.room;

/** Client for the Debug API only */
export const debugClient = appClient.debug;
