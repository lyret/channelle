import { createRemoteValueStore } from '~/lib/store-generators';

/** Keeps tracks of the configured scene layout */

export const sceneLayout =
	createRemoteValueStore<
		Array<Array<{ type: 'actor'; id: number } | { type: 'chat' }>>
	>('scene-layout');
