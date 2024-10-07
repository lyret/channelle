import { createOVStore } from '~/api/OVStore';

/** Keeps track of whenever participants are allowed to send effects over the scene */

export const sceneEffectsIsEnabled = createOVStore<boolean>(
	'scene-effects-is-enabled'
);
