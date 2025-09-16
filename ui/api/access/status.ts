import { readable, derived, type Readable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import type { DataTypes } from "~/lib";

/** The stored peer identification */
export const peerId = persisted(`${CONFIG.stage.id}-peer-id`, "");

/** Indicates that cookies are either accepted or denied/unknown */
export const cookiesAccepted = persisted(`${CONFIG.stage.id}-cookies-accepted`, false);

/** Indicates if the client is connected to the server through websocket */
export const isConnected = readable<boolean>(false);

/** Indicates that the client api is ready to for usage, i.e. browser side preparations are done */
export const isReady = readable<boolean>(false);

/** The current derived access status to the server api */
export const accessStatus: Readable<"error" | "blocked" | "disconnected" | "connected" | "ready"> = derived(
	[isConnected, isReady],
	([$isConnected, $isReady]) => {
		if (!$isConnected) {
			return "disconnected";
		} else {
			if ($isReady) {
				return "ready";
			}
			return "connected";
		}
	},
);

/** Indicates that the client api has crashed due to an error */
export const hasError = derived([accessStatus], ([$accessStatus]) => {
	if ($accessStatus === "error") {
		return true;
	}
	return false;
});

export const currentParticipant = derived([peerId], ([$peerId]) => {
	if ($peerId) {
		return {} as DataTypes["participant"]; // FIXME: should be a participant
	}
	return {
		id: -1,
		actor: false,
		blocked: false,
		manager: false,
		name: "",
	} as DataTypes["participant"];
});
