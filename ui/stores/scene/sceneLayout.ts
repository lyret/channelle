import { createRemoteValueStore } from '~/lib/store-generators';

/** Scene Layout Value */
export type SceneLayout = Array<
	Array<{ type: 'actor'; id: number } | { type: 'chat' } | { type: 'empty' }>
>;

/** Keeps tracks of the configured scene layout */
export const sceneLayout = createRemoteValueStore<SceneLayout>('scene-layout');
