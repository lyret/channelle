import { persisted } from "svelte-persisted-store";

/**
 * Persisted store that controls debug mode visibility.
 * Defaults to CONFIG.runtime.debug but can be toggled by users.
 */
export const debugModeStore = persisted(
	`${CONFIG.stage.id}-debug-mode`,
	CONFIG.runtime.debug
);
