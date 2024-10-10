import type * as MediaSoup from 'mediasoup-client';
import { writable } from 'svelte/store';
import { mediaRequest } from '../operations';
import { rtcSendTransport } from '~/lib/api';
import { getDeviceMediaStream } from '../device/getDeviceMediaStream';

/**
 * The Device Audio Store provides the current publishing status of local audio streams
 * and methods for changing the current state of publishing these
 */
export const DeviceAudioStore = createDeviceAudioStore();

/** Creates a Svelte Store for subscribing to the current publishing state of device audio */
function createDeviceAudioStore(): DeviceAudioStore {
	let _audioProducer: MediaSoup.types.Producer | undefined = undefined;
	let _value: DeviceAudioStoreValue = false;

	const { subscribe, set } = writable(_value, function start(_set) {
		return function stop() {};
	});

	return {
		isPublishing: () => _value,
		publishAudio: async () => {
			if (_audioProducer) {
				_audioProducer.resume();
			} else {
				const sendTransport = await rtcSendTransport();

				const audioStream = await getDeviceMediaStream('audio');
				const track = audioStream.getAudioTracks()[0];

				_audioProducer = await sendTransport.produce({ track });
			}
			_value = true;
			set(_value);
		},
		stopPublishingAudio: async () => {
			if (_audioProducer) {
				_audioProducer.pause();
			}
			_value = false;
			set(_value);
		},
		subscribe: subscribe,
	};
}

/** Device Audio Store Value */
export type DeviceAudioStoreValue = boolean;

/** Device Audio Store Interface */
interface DeviceAudioStore {
	isPublishing: () => boolean;
	/** Starts publishing audio */
	publishAudio: () => Promise<void>;
	/** Stops/pauses publishing audio */
	stopPublishingAudio: () => Promise<void>;
	subscribe: (handler: (value: DeviceAudioStoreValue) => void) => () => void;
}
