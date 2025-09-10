import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import type { RoomRouter } from "../../server/room";

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: "ws://localhost:3001",
});

/** Create a TRPC client for the room API  */
export const roomClient = createTRPCClient<RoomRouter>({
	links: [
		wsLink({
			client: wsClient,
		}),
	],
});

roomClient.sync.query().then((data) => {
	console.log("HERE");
	console.log(data);
});
