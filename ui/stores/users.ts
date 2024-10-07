import { createOMStore } from '~/lib/OMStore';

/** Keeps tracks of what users are currently online, [id]: boolean */
export const onlineStatus = createOMStore<number, boolean>(
	'user-online-status'
);

/** Keep tracks of what users are not allowed to use the camera, [id]: boolean */
export const userCameraBans = createOMStore<number, boolean>(
	'user-camera-banned'
);

/** Keep tracks of what users are not allowed to use the microphone, [id]: boolean */
export const userMicrophoneBans = createOMStore<number, boolean>(
	'user-mic-banned'
);
