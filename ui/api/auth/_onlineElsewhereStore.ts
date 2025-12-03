import { writable, derived } from "svelte/store";

/** Store to track duplicate session detection */
export const currentPeerOnlineCounter = writable<number>(0);
export const currentPeerIsOnlineElsewhere = derived(currentPeerOnlineCounter, ($currentPeerOnlineCounter) => {
	console.log("$currentPeerOnlineCounter", $currentPeerOnlineCounter);
	return $currentPeerOnlineCounter >= 2;
});
