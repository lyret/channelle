import { createRemoteValueStore } from "~/lib/store-generators";

/** Keeps tracks of the manually set curtain position by the managers */
export const sceneCurtains = createRemoteValueStore<boolean>("scene-curtains");
