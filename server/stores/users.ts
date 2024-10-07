import { observableMap } from '../lib';

/** Keeps tracks of what users are currently online, [id]: boolean */
export const userOnlineStatus = observableMap<number, boolean>(
	'user-online-status'
);

/** Keep tracks of what users are not allowed to use the camera, [id]: boolean */
export const userCameraBans = observableMap<number, boolean>(
	'user-camera-banned'
);

/** Keep tracks of what users are not allowed to use the microphone, [id]: boolean */
export const userMicrophoneBans = observableMap<number, boolean>(
	'user-mic-banned'
);
