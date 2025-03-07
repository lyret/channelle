import { createLocalStore } from "../_localStore";

/** Indicates that the chat sidepanel should be visible while the stage is active */
export const stageChat = createLocalStore("stage-chat-open", false);
