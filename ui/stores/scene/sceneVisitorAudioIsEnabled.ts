import { createRemoteValueStore } from '~/lib/store-generators';

/** Keeps track of whenever any visitor is allowed to use their microphone */

export const sceneVisitorAudioIsEnabled = createRemoteValueStore<boolean>(
	'scene-visitor-audio-is-enabled'
);
