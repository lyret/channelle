import type * as MediaSoupClient from 'mediasoup-client';
import { mediaSoupRouter } from '../api/mediaSoup';
import { createRTCResponseHandler } from '../rtc';

/** Handles incomming client events for the running servers real time protocol capabilities */
export const handleServerRTPCapabilitiesRequests =
	createRTCResponseHandler<MediaSoupClient.types.RtpCapabilities>(
		'rtp-capabilities',
		async () => {
			const rtpCapabilities = (await mediaSoupRouter()).rtpCapabilities;
			return rtpCapabilities;
		}
	);
