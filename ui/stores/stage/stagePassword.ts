import { persisted } from "svelte-persisted-store";
import { derived } from "svelte/store";
import { stagePasswordStore } from "~/api/room";

export const enteredStagePassword = persisted("participant-scene-password", "");

export const stagePasswordIsOk = derived([stagePasswordStore, enteredStagePassword], ([$stagePassword, $enteredStagePassword]) => {
	return !$stagePassword || $stagePassword == $enteredStagePassword;
});
