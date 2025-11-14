import { persisted } from "svelte-persisted-store";
import { derived } from "svelte/store";
import { showPasswordStore } from "~/api/shows";

/** Local Storage stored for the stage password entered by the user */
export const enteredStagePasswordStore = persisted("entered-stage-password", "");

/** Derived store indicating whether the entered stage password is correct */
export const isStagePasswordOkStore = derived([showPasswordStore, enteredStagePasswordStore], ([$stagePassword, $enteredStagePassword]) => {
	return !$stagePassword || $stagePassword == $enteredStagePassword;
});
