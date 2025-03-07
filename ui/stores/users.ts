import { createRemoteMapStore } from "~/lib/store-generators";

/** Keeps tracks of what users are currently online, [id]: boolean */
export const onlineStatus = createRemoteMapStore<number, boolean>(
	"user-online-status"
);

/** Keep tracks of what users are not allowed to use the camera, [id]: boolean */
export const userCameraBans = createRemoteMapStore<number, boolean>(
	"user-camera-banned"
);

/** Keep tracks of what users are not allowed to use the microphone, [id]: boolean */
export const userMicrophoneBans = createRemoteMapStore<number, boolean>(
	"user-mic-banned"
);
