import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server/_types";
import { writable, get } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";

/** Types for all router inputs */
export type RouterInputTypes = inferRouterInputs<AppRouter>;

/** Types for all router outputs */
export type RouterOutputTypes = inferRouterOutputs<AppRouter>;

/** The stored webscoket peer identification used for re-authentications */
export const wsPeerIdStore = persisted(`${CONFIG.runtime.slug}-peer-id`, "");

/** The current connection ID for this session (not persisted) */
export let wsConnectionId = "";

/** The device type for this session */
export const connectionDeviceTypeStore = writable<string>("");

/** The route type for this session */
export const connectionRouteTypeStore = writable<string>("");

/** Svelte Store that indicates if the client is connected to the server through websocket */
export const wsIsConnectedStore = writable<boolean>(false);

/** Create persistent WebSocket connection */
const wsClient = createWSClient({
	url: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`,
	connectionParams: async () => {
		// Get peer id from URL params, storage, or generate a new random UUIDv4 token
		const urlParams = new URLSearchParams(window.location.search);
		const urlPeerId = urlParams.get("peerId");
		const peerId =
			urlPeerId || get(wsPeerIdStore) || "111-111-1111".replace(/[018]/g, () => (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16));

		// Generate a unique connection ID for this session (not persisted)
		const connectionId = "111-111-1111".replace(/[018]/g, () => (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16));

		// Detect device type using browser APIs
		const deviceType = detectDeviceType();

		// Detect current route type
		const routeType = detectCurrentRouteType();

		// Update the persisted peer id and session stores
		wsPeerIdStore.set(peerId);
		wsConnectionId = connectionId;
		connectionDeviceTypeStore.set(deviceType);
		connectionRouteTypeStore.set(routeType);

		// Connect to the TRPC server using these connection parameters
		return {
			peerId: peerId,
			connectionId: connectionId,
			deviceType: deviceType,
			routeType: routeType,
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

/** Client for the Stage API only (stage router on server) */
export const stageClient = appClient.media;

/** Client for the backstage API only */
export const backstageClient = appClient.backstage;

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

/** Client for the Peers API only */
export const peersClient = appClient.peers;

/** Client for the Theater-side IPC API only */
export const theaterClient = appClient.theater;

/** Client for the History API only */
export const historyClient = appClient.history;

/**
 * Detect device type using browser APIs
 * Returns "mobile" for mobile devices, "desktop" for desktop/laptop
 */
function detectDeviceType(): string {
	// Check for touch support and screen size
	const hasTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints > 0;
	const screenWidth = window.screen.width;
	const userAgent = navigator.userAgent.toLowerCase();

	// Check for mobile user agents
	const mobileKeywords = ["mobile", "android", "iphone", "ipad", "ipod", "blackberry", "windows phone"];
	const isMobileUA = mobileKeywords.some((keyword) => userAgent.includes(keyword));

	// Combine checks: mobile if small screen + touch OR mobile user agent
	if ((screenWidth <= 768 && hasTouchScreen) || isMobileUA) {
		return "mobile";
	}

	return "desktop";
}

/**
 * Detect current route type based on URL pathname
 * Returns "stage", "backstage", or "unknown"
 */
function detectCurrentRouteType(): string {
	const pathname = window.location.pathname;

	// Stage routes
	if (pathname === "/" || pathname.startsWith("/stage")) {
		return "stage";
	}

	// Backstage routes
	if (pathname.startsWith("/backstage")) {
		return "backstage";
	}

	// All other routes
	return "unknown";
}
