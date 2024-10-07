import { createOVStore } from '~/api/OVStore';
import { createLocalStore } from '../_localStore';
import { derived } from 'svelte/store';

export const scenePassword = createOVStore<string>('scene-password');

export const participantScenePassword = createLocalStore<string>(
	'participant-scene-password',
	''
);

export const scenePasswordIsOk = derived(
	[scenePassword, participantScenePassword],
	([$scenePassword, $participantScenePassword]) => {
		return (
			(scenePassword.isConnected() && !$scenePassword) ||
			$scenePassword == $participantScenePassword
		);
	}
);
