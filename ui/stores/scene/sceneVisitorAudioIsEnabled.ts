import { createOVStore } from '~/api/OVStore';

/** Keeps track of whenever any visitor is allowed to use their microphone */

export const sceneVisitorAudioIsEnabled = createOVStore<boolean>(
	'scene-visitor-audio-is-enabled'
);
