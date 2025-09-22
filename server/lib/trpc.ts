import type { TRPCRootObject, TRPCRuntimeConfigOptions } from "@trpc/server";
import type { MediaTag } from "./mediaSoup";
import { initTRPC } from "@trpc/server";

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

/** Information about a connected tcrp peer kept in the room state server side */
export type Peer = {
	id: string;
	joinTs: number;
	lastSeenTs: number;
	media: Partial<Record<MediaTag, any>>;
	stats: any;
	consumerLayers: any;
	name: string;
	actor: boolean;
	manager: boolean;
	banned: boolean;
};

/** TRPC Context */
export interface Context {
	peer: undefined | Peer;
}
