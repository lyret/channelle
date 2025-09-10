import type { TRPCRootObject, TRPCRuntimeConfigOptions } from "@trpc/server";
import { initTRPC } from "@trpc/server";

let _trcp: TRPCRootObject<Context, object, TRPCRuntimeConfigOptions<object, object>> | undefined;

/** Returns the global trcp backend server  */
export function trcp(): TRPCRootObject<Context, object, TRPCRuntimeConfigOptions<object, object>> {
	// Return already initialized singelton instance
	if (_trcp) {
		return _trcp;
	}

	// Create and return the trcp backend;
	_trcp = initTRPC.context<Context>().create();

	return _trcp;
}

/** TRPC Context */
export interface Context {
	peer?: {
		id: string;
	};
}
