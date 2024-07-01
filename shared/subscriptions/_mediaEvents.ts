import type { DeviceStatusName } from './_deviceStatusName';

/** Available events emitted from the API class implementation */
export type MediaEvents = {
	deviceStatus: DeviceStatusName;
	localMediaStream: MediaStream | undefined;
	remoteMediaStreams: Array<MediaStream>;
};
