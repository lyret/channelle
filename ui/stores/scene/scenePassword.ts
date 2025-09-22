import { derived } from "svelte/store";
import { createLocalStore } from "../_localStore";
import { stagePasswordStore } from "~/api/room";

export const participantScenePassword = createLocalStore<string>("participant-scene-password", "");

export const scenePasswordIsOk = derived([stagePasswordStore, participantScenePassword], ([$scenePassword, $participantScenePassword]) => {
	return !$scenePassword || $scenePassword == $participantScenePassword;
});
