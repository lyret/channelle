import { derived } from "svelte/store";
import { wsPeerIdStore } from "../_trpcClient";
import { showPeersStore } from "../backstage";

/** The current users peer information  */
export const currentPeerStore = derived([showPeersStore, wsPeerIdStore], ([$peers, $peerId]) => {
	return $peers[$peerId] || ({} as any);
});

/**
 * Indicates whether the client has successfully autenticated with the server
 */
export const hasAutenticated = derived([currentPeerStore], ([$peer]) => {
	return Object.keys($peer).length > 0;
});

/**
 * Indicates whether the client is banned from media participation
 */
export const currentPeerIsBannedStore = derived([currentPeerStore], ([$peer]) => {
	return $peer && $peer.banned;
});
