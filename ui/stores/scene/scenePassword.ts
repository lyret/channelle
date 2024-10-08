import { createRemoteValueStore } from '~/lib/store-generators';
import { createLocalStore } from '../_localStore';
import { derived } from 'svelte/store';

export const scenePassword = createRemoteValueStore<string>('scene-password');

export const participantScenePassword = createLocalStore<string>(
	'participant-scene-password',
	''
);

export const scenePasswordIsOk = derived(
	[scenePassword, participantScenePassword],
	([$scenePassword, $participantScenePassword]) => {
		return !$scenePassword || $scenePassword == $participantScenePassword;
	}
);
