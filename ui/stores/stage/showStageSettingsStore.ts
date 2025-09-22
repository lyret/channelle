import { persisted } from "svelte-persisted-store";

/** Indicates that the settings sidepanel should be visible while the stage is active */
export const showStageStettingsStore = persisted("stage-settings-open", false);
