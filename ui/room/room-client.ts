import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { RoomRouter } from "../../server/room";

/** Create a TRPC client for the room API  */
const roomClient = createTRPCClient<RoomRouter>({
	links: [
		httpBatchLink({
			url: `https://${CONFIG.web.host}:${CONFIG.web.port}/room`,
		}),
	],
});

const test = await roomClient.query({});
