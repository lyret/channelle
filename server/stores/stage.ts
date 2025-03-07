import { createValueStore } from "../lib/stores";

/** Stage Layout Value */
export type StageLayout = Array<
	Array<{ type: "actor"; id: number } | { type: "chat" } | { type: "empty" }>
>;

/** A Predefined layout from the scene instrument */
export type PredefinedLayout = {
	name: string;
	chatEnabled: boolean;
	layout: StageLayout;
};

/** Keeps track of the selected predefined layout in the scene instrument */
export const selectedPredefinedStageLayout = createValueStore<
	PredefinedLayout | undefined
>("selected-predefined-stage-layout", undefined);

/** Keeps tracks of the configured stage window layout */
export const stageLayout = createValueStore<StageLayout>("stage-layout", []);
