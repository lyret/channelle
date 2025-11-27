import { derived, type Readable } from "svelte/store";
import { peerStreamsStore, sessionsStore } from "~/api/stageNew";
import { showSelectedSceneStore } from "~/api/backstage";
import type { StageLayout } from "~/types/serverSideTypes";

/** The stage layout with additional information calculated from the values of several other stores */
type CalculatedStageLayoutStoreValue = {
	layout: StageLayout;
	videoLeftovers: Array<{ type: "actor" | "visitor"; peerId: string }>;
	audioLeftovers: Array<{ type: "actor" | "visitor"; peerId: string }>;
	isAutoLayout: boolean;
};

/** Gives the stage layout with additional information calculated from the values of several other stores */
export const calculatedStageLayoutStore = derived(
	[showSelectedSceneStore, peerStreamsStore, sessionsStore],
	([$selectedScene, $peerStreams, $sessions], _set) => {
		const $stageLayout = $selectedScene?.layout || [];

		// Determine if the layout is set to auto
		const isAutoLayout = !$stageLayout.length || ($stageLayout.length == 1 && !$stageLayout[0].length);

		console.log("[StageLayout] Auto layout:", isAutoLayout, "PeerStreams:", Object.keys($peerStreams).length, "Layout:", $stageLayout);

		// Find leftovers, i.e video streams not explicitly assigned in the layout
		const audioLeftovers: CalculatedStageLayoutStoreValue["audioLeftovers"] = [];
		const videoLeftovers: CalculatedStageLayoutStoreValue["videoLeftovers"] = [];

		if (isAutoLayout) {
			// In auto layout mode, show ALL video streams from peers
			for (const [peerId, stream] of Object.entries($peerStreams)) {
				// Check if this peer has video tracks
				if (stream && stream.getVideoTracks().length > 0) {
					console.log("[StageLayout] Adding video for peer:", peerId);
					videoLeftovers.push({
						type: "actor",
						peerId: peerId,
					});
				}
				// Check if this peer has audio tracks (for audio-only leftovers)
				if (stream && stream.getAudioTracks().length > 0 && stream.getVideoTracks().length === 0) {
					console.log("[StageLayout] Adding audio-only for peer:", peerId);
					audioLeftovers.push({
						type: "actor",
						peerId: peerId,
					});
				}
			}
			console.log("[StageLayout] Auto layout leftovers - Video:", videoLeftovers.length, "Audio:", audioLeftovers.length);
		} else {
			// In manual layout mode, find peers not explicitly placed on stage
			const peerIdsOnStage = new Set<string>();
			$stageLayout.forEach((row) =>
				row.forEach((cell) => {
					if (cell.type == "actor") {
						peerIdsOnStage.add(cell.peerId);
					}
				}),
			);

			// Add any video/audio streams not in the manual layout to leftovers
			for (const [peerId, stream] of Object.entries($peerStreams)) {
				if (!peerIdsOnStage.has(peerId) && stream) {
					// Check if this peer has video tracks
					if (stream.getVideoTracks().length > 0) {
						videoLeftovers.push({
							type: "actor",
							peerId: peerId,
						});
					}
					// Check if this peer has audio tracks (for audio-only leftovers)
					else if (stream.getAudioTracks().length > 0) {
						audioLeftovers.push({
							type: "actor",
							peerId: peerId,
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
	},
) as Readable<CalculatedStageLayoutStoreValue>;
