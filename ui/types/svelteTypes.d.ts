import type { CONFIG } from "../../shared/types/config.d.ts";
import type * as Server from "../../server/_types";

declare global {
	namespace svelteHTML {
		interface HTMLAttributes {
			"on:click_outside"?: (event: any) => any;
		}
	}

	const CONFIG: CONFIG;

	interface Window {
		CONFIG: CONFIG;
	}
}

export {};
