import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { RoomRouter } from "../../server/room";

const roomTRPC = createTRPCClient<RoomRouter>({
	links: [
		httpBatchLink({
			url: `https://${CONFIG.web.host}:${CONFIG.web.port}`,
		}),
	],
});

roomTRPC.consumerSetLayers.mutate({ id: "123", layers: ["video", "audio"] });
