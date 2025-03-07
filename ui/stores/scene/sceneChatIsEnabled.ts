import { createRemoteValueStore } from '~/lib/store-generators';

/** Keeps track of whenever participants are allowed to access the chat at any time */

export const sceneChatIsEnabled = createRemoteValueStore<boolean>(
	'scene-chat-is-enabled'
);