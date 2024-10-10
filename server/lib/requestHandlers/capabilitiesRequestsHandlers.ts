import type * as MediaSoupClient from 'mediasoup-client';
import { createRTCResponseHandler } from '../rtc';
import { mediaSoupRouter } from '../api/mediaSoup';

/** Handles incomming client events for the running servers real time protocol capabilities */
export const handleServerRTPCapabilitiesRequests =
	createRTCResponseHandler<MediaSoupClient.types.RtpCapabilities>(
		'rtp-capabilities',
		async (_, socket) => {
			const rtpCapabilities = (await mediaSoupRouter()).rtpCapabilities;
			return rtpCapabilities;
		}
	);
