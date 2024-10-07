import { createMapStore } from '../lib/stores';

/** Keeps tracks of what users are currently online, [id]: boolean */
export const userOnlineStatus = createMapStore<number, boolean>(
	'user-online-status'
);

/** Keep tracks of what users are not allowed to use the camera, [id]: boolean */
export const userCameraBans = createMapStore<number, boolean>(
	'user-camera-banned'
);

/** Keep tracks of what users are not allowed to use the microphone, [id]: boolean */
export const userMicrophoneBans = createMapStore<number, boolean>(
	'user-mic-banned'
);
