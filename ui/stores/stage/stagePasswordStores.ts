import { persisted } from "svelte-persisted-store";
import { derived } from "svelte/store";
import { passwordStore } from "~/api/config";

/** Local Storage stored for the stage password entered by the user */
export const enteredStagePasswordStore = persisted("entered-stage-password", "");

/** Derived store indicating whether the entered stage password is correct */
export const isStagePasswordOkStore = derived([passwordStore, enteredStagePasswordStore], ([$stagePassword, $enteredStagePassword]) => {
	return !$stagePassword || $stagePassword == $enteredStagePassword;
});
