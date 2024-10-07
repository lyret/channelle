import type * as MediaSoup from 'mediasoup';
import type { MediaRequests } from '../../shared';
import { createMapStore } from '../lib/stores';

/** Keeps tracks of web rtc transports for incomming media streams from producers */
export const mediaProducerTransports = createMapStore<
	string,
	MediaSoup.types.WebRtcTransport
>('media-producer-transports', {
	// Close any producer transport when deleted from the map
	onDelete: (transport) => {
		transport.close();
	},
});

/** Keeps tracks of web rtc transports for receivers that wants to consume outgoing media streams */
export const mediaReceiverTransports = createMapStore<
	string,
	{
		options: MediaRequests['transport_receiver_create'][0];
		transport: MediaSoup.types.WebRtcTransport;
		consumers: Array<MediaSoup.types.Consumer>;
	}
>('media-receiver-transports', {
	// Close any receiver transport when deleted from the map
	onDelete: ({ transport }) => {
		transport.close();
	},
});

/** Contains media soup producer objects for each active producer of video */
export const videoProducers = createMapStore<string, MediaSoup.types.Producer>(
	'media-video-producers',
	{
		// Close any producer when deleted from the map
		onDelete: (producer) => {
			producer.close();
		},
	}
);
/** Contains media soup producer objects for each active producer of audio */

export const audioProducers = createMapStore<string, MediaSoup.types.Producer>(
	'media-audio-producers',
	{
		// Close any producer when deleted from the map
		onDelete: (producer) => {
			producer.close();
		},
	}
);
