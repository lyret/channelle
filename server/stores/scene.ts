import { createValueStore } from '../lib/stores';

/** Keeps tracks of the currently set scene password, if any */
export const scenePassword = createValueStore<string>('scene-password', '');

/** Keeps tracks of the manually set curtain position by the managers */
export const sceneCurtains = createValueStore<boolean>('scene-curtains', false);

/** Keeps tracks of the configured scene layout */
export const sceneLayout = createValueStore<
	Array<Array<{ type: 'actor'; id: number } | { type: 'chat' }>>
>('scene-layout', [[{ type: 'actor', id: 33 }]]);

/** Keeps track of whenever any visitor is allowed to use their microphone */
export const sceneVisitorAudioIsEnabled = createValueStore<boolean>(
	'scene-visitor-audio-is-enabled',
	false
);

/** Keeps track of whenever participants are allowed to send effects over the scene */
export const sceneEffectsIsEnabled = createValueStore<boolean>(
	'scene-effects-is-enabled',
	false
);

/** Keeps track of whenever participants are allowed to access the chat at any time */
export const sceneChatIsEnabled = createValueStore<boolean>(
	'scene-chat-is-enabled',
	false
);
