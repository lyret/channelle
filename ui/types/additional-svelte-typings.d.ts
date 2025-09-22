import type { CONFIG } from "../../shared/types/config.d.ts";

declare namespace svelteHTML {
	interface HTMLAttributes {
		"on:click_outside"?: (event: any) => any;
	}
}

declare global {
	const CONFIG: CONFIG;

	interface Window {
		CONFIG: CONFIG;
	}
}

export {};
