import { writable, get } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import type { AppRouter } from "../../server/_types";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";

/** The stored webscoket peer identification used for re-authentications */
export const wsPeerIdStore = persisted(`${CONFIG.stage.id}-peer-id`, "");

/** Svelte Store that indicates if the client is connected to the server through websocket */
export const wsIsConnectedStore = writable<boolean>(false);

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`,
	connectionParams: async () => {
		// Get peer id from storage, or generate a new random UUIDv4 token
		const peerId = get(wsPeerIdStore) || "111-111-1111".replace(/[018]/g, () => (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16));

		// Update the persisted peer id
		wsPeerIdStore.set(peerId);

		// Connect to the TRPC server using these connection parameters
		return {
			peerId: peerId,
		};
	},
	onOpen: () => {
		wsIsConnectedStore.set(true);
		console.log("WebSocket connection opened");
	},
	onClose: () => {
		wsIsConnectedStore.set(false);
		console.log("WebSocket connection closed");
	},
});

/** The TRPC client for the whole API  */
export const appClient = createTRPCClient<AppRouter>({
	links: [
		wsLink({
			client: wsClient,
		}),
	],
});

/** Client for the Media API only (room router on server) */
export const mediaClient = appClient.media;

/** Client for the Configuration API only */
export const configClient = appClient.config;

/** Client for the Shows API only */
export const showsClient = appClient.shows;

/** Client for the Development API only */
export const developmentClient = appClient.development;

/** Client for the Chat API only */
export const chatClient = appClient.chat;

/** Client for the Effects API only */
export const effectsClient = appClient.effects;

/** Client for the Authentication API only */
export const authClient = appClient.auth;

/** Client for the Users API only */
export const userClient = appClient.users;

/** Client for the Launchers API only */
export const launchersClient = appClient.launchers;
