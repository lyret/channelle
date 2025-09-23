import { persisted } from "svelte-persisted-store";

/** Indicates that the chat sidepanel should be visible while the stage is active */
export const showStageChatStore = persisted("stage-chat-open", false);

/** Indicates that the settings sidepanel should be visible while the stage is active */
export const showStageStettingsStore = persisted("stage-settings-open", false);
