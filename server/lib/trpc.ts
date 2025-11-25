import type { TRPCRootObject, TRPCRuntimeConfigOptions } from "@trpc/server";
import type { MediaTag } from "./mediaSoup";
import { initTRPC } from "@trpc/server";
import type { Peer } from "../models/Peer";

let _trcp: TRPCRootObject<Context, object, TRPCRuntimeConfigOptions<object, object>> | undefined;

/** Returns the global trcp backend server  */
export function trpc(): TRPCRootObject<Context, object, TRPCRuntimeConfigOptions<object, object>> {
	// Return already initialized singelton instance
	if (_trcp) {
		return _trcp;
	}

	// Create and return the trcp backend;
	_trcp = initTRPC.context<Context>().create();

	return _trcp;
}

/** Information for a peer containing webrtc and trpc data that is unique for each connected session */
export type MediaSession = {
	peerId: string;
	banned: boolean;
	audioMuted: boolean;
	videoMuted: boolean;
	joinTs: number;
	lastSeenTs: number;
	media: Partial<Record<MediaTag, any>>;
	stats: any;
	consumerLayers: any;
};

/** Information for a peer for managing session data for when authenticated as an admin */
export type AdminSession = {
	peerId: string;
	joinTs: number;
	lastSeenTs: number;
};

/** TRPC Context */
export interface Context {
	peer: undefined | Peer;
}
