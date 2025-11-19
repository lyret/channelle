import { persisted } from "svelte-persisted-store";

/** Indicates that the chat sidepanel should be visible while the stage is active */
export const showStageChatStore = persisted(`${CONFIG.runtime.slug}-stage-chat-open`, false);

/** Indicates that the settings sidepanel should be visible while the stage is active */
export const showStageSettingsStore = persisted(`${CONFIG.runtime.slug}-stage-settings-open`, false);
