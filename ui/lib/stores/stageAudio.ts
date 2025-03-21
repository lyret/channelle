import { derived, type Readable } from "svelte/store";
import { sceneVisitorAudioIsEnabled } from "~/stores/scene/sceneVisitorAudioIsEnabled";
import { stageLayout } from "~/stores/stage/stageLayout";
import type { DataTypes } from "../_databaseTypes";
import { ConsumedMediaStore } from "./consumedMedia";

// TODO: Document
export const StageAudio = derived(
	[ConsumedMediaStore, stageLayout, sceneVisitorAudioIsEnabled],
	([$ConsumedMediaStore, $stageLayout, $sceneVisitorAudioIsEnabled], _set) => {
		const handled = new Set<number>();
		const updatedAudio: StageAudioStoreValue["audio"] = [];
		for (const row of $stageLayout) {
			for (const cell of row) {
				if (cell.type == "actor") {
					const stream = $ConsumedMediaStore.find(
						(s) => s.kind == "audio" && s.participant?.id == cell.id
					);

					if (stream && !handled.has(stream.participant.id)) {
						updatedAudio.push({
							type: "actor",
							id: cell.id,
							participant: stream.participant,
							stream: stream.stream,
						});
						handled.add(stream.participant.id);
					}
				}
			}
		}

		// Find leftovers
		if ($sceneVisitorAudioIsEnabled) {
			for (const stream of $ConsumedMediaStore) {
				if (
					stream.kind == "audio" &&
					stream.participant?.id &&
					!handled.has(stream.participant.id)
				)
					updatedAudio.push({
						type: "actor",
						id: stream.participant.id,
						participant: stream.participant,
						stream: stream.stream,
					});
			}
		}

		const _value: StageAudioStoreValue = {
			audio: updatedAudio.sort((a, b) =>
				a.id > b.id ? 1 : a.id < b.id ? -1 : 0
			),
		};
		_set(_value);
	}
) as Readable<StageAudioStoreValue>;

/** Stage Audio Store Value */
export type StageAudioStoreValue = {
	audio: Array<StageAudioActorWithStream>;
};

// TODO: document
export type StageAudioActorWithStream = {
	type: "actor";
	id: number;
	participant: DataTypes["participant"];
	stream?: MediaStream | undefined;
};
