import { createOVStore } from '~/lib/OVStore';

/** Keeps tracks of the configured scene layout */

export const sceneLayout =
	createOVStore<Array<Array<{ type: 'actor'; id: number } | { type: 'chat' }>>>(
		'scene-layout'
	);
