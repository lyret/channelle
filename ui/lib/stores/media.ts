import { readable } from 'svelte/store';
import { mediaRequest } from '../operations';
import { ws } from '~/lib/api';
import { createRTCConsumerTransport } from '../rtc';

/**
 * The Media store provides all media streams, both from this client and from the MediaSoup server
 */
export const MediaStore = createMediaStore();

/** Creates a Svelte Store for consuming MediaSoup streams from the server */
function createMediaStore(): MediaStore {
	const _socket = ws();
	let _value: MediaStoreValue = {
		localMediaStream: undefined,
		remoteMediaStreams: {},
	};
	let _isConsuming: boolean = false;

	const { subscribe } = readable(_value, function start(_set) {
		// Consume any new media stream produced on the media soup server
		const _onConsume = async () => {
			const transport = await createRTCConsumerTransport();
			// Get consumers
			const { consumers } = await mediaRequest('transport_receiver_consume');

			// Start consuming
			const streams: Record<string, MediaStream> = {};
			for (const {
				id,
				producerId,
				kind,
				rtpParameters,
				participantId,
			} of consumers) {
				const consumer = await transport.consume({
					id,
					producerId,
					kind,
					rtpParameters,
				});
				streams[participantId] = streams[participantId] || new MediaStream();
				streams[participantId].addTrack(consumer.track);
			}
			_isConsuming = true;
			_value.remoteMediaStreams = streams;
			_set(_value);
		};
		_socket.on('producers_update', _onConsume);

		// Consume any already producing media stream
		_onConsume();

		return function stop() {
			_isConsuming = false;
			_socket.off('producers_update', _onConsume);
			mediaRequest('remove_consumer');
		};
	});

	return {
		subscribe: subscribe,
		isConsuming: () => _isConsuming,
	};
}

/** Media Store Value */
export type MediaStoreValue = {
	/** Any media stream generated from this device */
	localMediaStream: MediaStream | undefined;
	/** Any media streams coming in from other connected users */
	remoteMediaStreams: Record<number, MediaStream>;
};

/** Media Store Interface */
interface MediaStore {
	isConsuming: () => boolean;
	subscribe: (handler: (value: MediaStoreValue) => void) => () => void;
}
