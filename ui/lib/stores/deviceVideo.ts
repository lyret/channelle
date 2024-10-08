import type * as MediaSoup from 'mediasoup-client';
import { writable } from 'svelte/store';
import { mediaRequest } from '../operations';
import { ws, rtcSendTransport } from '~/lib/api';
import { getDeviceMediaStream } from '../device/getDeviceMediaStream';

/**
 * The Device Video Store provides the current publishing status of local video streams
 * and methods for changing the current state of publishing these
 */
export const DeviceVideoStore = createDeviceVideoStore();

/** Creates a Svelte Store for subscribing to the current publishing state of device video */
function createDeviceVideoStore(): DeviceVideoStore {
	const _socket = ws();
	let _videoProducer: MediaSoup.types.Producer | undefined = undefined;
	let _value: DeviceVideoStoreValue = false;
	let _isPublishing: boolean = false;

	const { subscribe, set } = writable(_value, function start(_set) {
		return function stop() {};
	});
	return {
		isPublishing: () => _isPublishing,
		publishVideo: async () => {
			if (_videoProducer) {
				_videoProducer.resume();
			} else {
				const sendTransport = await rtcSendTransport();

				const videoStream = await getDeviceMediaStream('camera');
				const track = videoStream.getVideoTracks()[0];

				_videoProducer = await sendTransport.produce({ track });
				// TODO: need resume?
				//await transport.produce({ track: audioTrack });
				// FIXME: this.localMediaStream = videoStream;
			}
			_value = true;
			set(_value);
		},
		stopPublishingVideo: async () => {
			if (_videoProducer) {
				_videoProducer.pause();
				//request('remove_producer', { video: true });
			}
			_value = false;
			set(_value);
		},
		subscribe: subscribe,
	};
}

/** Device Video Store Value */
export type DeviceVideoStoreValue = boolean;

/** Device Video Store Interface */
interface DeviceVideoStore {
	isPublishing: () => boolean;
	/** Starts publishing video */
	publishVideo: () => Promise<void>;
	/** Stops/pauses publishing video */
	stopPublishingVideo: () => Promise<void>;
	subscribe: (handler: (value: DeviceVideoStoreValue) => void) => () => void;
}
