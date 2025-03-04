import { derived, type Readable } from 'svelte/store';
import { stageLayout } from '~/stores/stage/stageLayout';
import type { DataTypes } from '../_databaseTypes';
import { ConsumedMediaStore } from './consumedMedia';

export const StageLayout = derived(
	[ConsumedMediaStore, stageLayout],
	([$ConsumedMediaStore, $stageLayout], _set) => {
		const handled = new Set<number>();
		const updatedLeftovers: StageLayoutStoreValue['leftovers'] = [];
		const updatedLayout: StageLayoutWithStreams = [];
		for (const row of $stageLayout) {
			const updatedRow: StageLayoutWithStreams[number] = [];
			for (const cell of row) {
				if (cell.type == 'actor') {
					const stream = $ConsumedMediaStore.find(
						(s) => s.kind == 'video' && s.participant?.id == cell.id
					);

					if (stream) {
						updatedRow.push({
							type: 'actor',
							id: cell.id,
							participant: stream.participant,
							stream: stream.stream,
						});
						handled.add(stream.participant.id);
					} else {
						updatedRow.push({ type: 'empty' });
					}
				} else {
					updatedRow.push(cell);
				}
			}
			updatedLayout.push(updatedRow);
		}

		// Find leftovers
		for (const stream of $ConsumedMediaStore) {
			if (
				stream.participant?.id &&
				!handled.has(stream.participant.id) &&
				stream.kind == 'video'
			) {
				updatedLeftovers.push({
					type: 'actor',
					id: stream.participant.id,
					participant: stream.participant,
					stream: stream.stream,
				});
			}
		}

		const _value: StageLayoutStoreValue = {
			layout: updatedLayout,
			leftovers: updatedLeftovers,
			isAutoLayout:
				!updatedLayout.length ||
				(updatedLayout.length == 1 && !updatedLayout[0].length),
		};
		_set(_value);
	}
) as Readable<StageLayoutStoreValue>;

/** Stage Layout Store Value */
export type StageLayoutStoreValue = {
	isAutoLayout: boolean;
	leftovers: Array<StageLayoutActorWithStream>; // TODO: leftovers is only used in auto layout
	layout: StageLayoutWithStreams;
};

/** Stage Layout Store Interface */
interface StageLayoutStore {
	subscribe: (handler: (value: StageLayoutStoreValue) => void) => () => void;
}
// TODO: document
export type StageLayoutWithStreams = Array<
	Array<StageLayoutActorWithStream | { type: 'chat' } | { type: 'empty' }>
>;

// TODO: document
export type StageLayoutActorWithStream = {
	type: 'actor';
	id: number;
	participant: DataTypes['participant'];
	stream?: MediaStream | undefined;
};
