import { derived } from "svelte/store";
import { wsPeerIdStore } from "../_trpcClient";
import { showPeersStore } from "../backstage";

/** The current users peer information  */
export const currentPeerStore = derived([showPeersStore, wsPeerIdStore], ([$peers, $peerId]) => {
	return $peers[$peerId] || ({} as any);
});
