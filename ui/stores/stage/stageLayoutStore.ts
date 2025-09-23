import { derived, type Readable } from "svelte/store";
import { consumersStore, stageLayoutStore } from "~/api/room";
import type { StageLayout } from "~/types/serverSideTypes";

/** The stage layout with additional information calculated from the values of several other stores */
type CalculatedStageLayoutStoreValue = {
	layout: StageLayout;
	videoLeftovers: Array<{ type: "actor" | "visitor"; peerId: string }>;
	audioLeftovers: Array<{ type: "actor" | "visitor"; peerId: string }>;
	isAutoLayout: boolean;
};

/** Gives the stage layout with additional information calculated from the values of several other stores */
export const calculatedStageLayoutStore = derived([stageLayoutStore, consumersStore], ([$stageLayout, $consumers], _set) => {
	// Find all peerIds from cells in the stage layout matrix
	const peerIdsOnStage = new Set<string>();
	$stageLayout.forEach((row) =>
		row.forEach((cell) => {
			if (cell.type == "actor") {
				peerIdsOnStage.add(cell.peerId);
			}
		}),
	);
	// Determine if the layout is set to auto
	const isAutoLayout = !$stageLayout.length || ($stageLayout.length == 1 && !$stageLayout[0].length);

	// Find leftovers, i.e video streams not explicitly assigned in the layout
	const audioLeftovers: CalculatedStageLayoutStoreValue["audioLeftovers"] = [];
	const videoLeftovers: CalculatedStageLayoutStoreValue["videoLeftovers"] = [];
	if (isAutoLayout) {
		for (const consumer of $consumers) {
			if (consumer.appData.peerId && !peerIdsOnStage.has(consumer.appData.peerId)) {
				if (consumer.appData.mediaTag == "cam-video") {
					videoLeftovers.push({
						type: "actor",
						peerId: consumer.appData.peerId,
					});
				} else if (consumer.appData.mediaTag == "mic-audio") {
					audioLeftovers.push({
						type: "actor",
						peerId: consumer.appData.peerId,
					});
				}
			}
		}
	}

	const _value: CalculatedStageLayoutStoreValue = {
		layout: $stageLayout,
		audioLeftovers: audioLeftovers,
		videoLeftovers: videoLeftovers,
		isAutoLayout: isAutoLayout,
	};
	_set(_value);
}) as Readable<CalculatedStageLayoutStoreValue>;
