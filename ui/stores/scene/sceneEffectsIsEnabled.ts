import { createRemoteValueStore } from '~/lib/store-generators';

/** Keeps track of whenever participants are allowed to send effects over the scene */

export const sceneEffectsIsEnabled = createRemoteValueStore<boolean>(
	'scene-effects-is-enabled'
);
