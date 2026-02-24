import { writable } from "svelte/store";

/** Indicates that the current peer has been rejected and its connection closed */
export const currentPeerIsRejected = writable("");
