import { createLocalStore } from "../_localStore";

/** Indicates that the settings sidepanel should be visible while the stage is active */
export const stageSettings = createLocalStore("stage-settings-open", false);
