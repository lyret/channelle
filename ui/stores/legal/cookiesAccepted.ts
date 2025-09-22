import { persisted } from "svelte-persisted-store";

/** Indicates that cookies are either accepted or denied/unknown */
export const cookiesAccepted = persisted(`${CONFIG.stage.id}-cookies-accepted`, false);
