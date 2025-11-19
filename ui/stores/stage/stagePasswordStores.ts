import { persisted } from "svelte-persisted-store";
import { derived } from "svelte/store";
import { showPasswordStore } from "~/api/backstage";

/** Local Storage stored for the stage password entered by the user */
export const enteredStagePasswordStore = persisted(`${CONFIG.runtime.slug}-entered-stage-password`, "");

/** Derived store indicating whether the entered stage password is correct */
export const isStagePasswordOkStore = derived([showPasswordStore, enteredStagePasswordStore], ([$stagePassword, $enteredStagePassword]) => {
	return !$stagePassword || $stagePassword == $enteredStagePassword;
});
