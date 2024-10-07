import { createOVStore } from '~/api/OVStore';

/** Keeps track of whenever participants are allowed to access the chat at any time */

export const sceneChatIsEnabled = createOVStore<boolean>(
	'scene-chat-is-enabled'
);
