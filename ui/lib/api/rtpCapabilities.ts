import type * as MediaSoup from 'mediasoup-client';
import { mediaRequest } from '../operations'; // TODO: remove this import
import { mediaDevice } from './mediaDevice';

/** This clients supported real time protocol capabilities */
let _rtpCapabilities: MediaSoup.types.RtpCapabilities | undefined = undefined;

/** Returns the globaly determined rtp capabilities between this client and the server */
export async function rtpCapabilities(): Promise<MediaSoup.types.RtpCapabilities> {
	// Return cached capabilities
	if (_rtpCapabilities) {
		return _rtpCapabilities;
	}

	// Load remote rtp capabilities from  the server
	_rtpCapabilities = await mediaRequest('server_rtp_capabilities');

	// Supply the deterimined RTP capabilities to the local device's media router
	await mediaDevice().load({
		routerRtpCapabilities: _rtpCapabilities,
	});

	// Get the complete rtp capabilities out from the device
	_rtpCapabilities = mediaDevice().rtpCapabilities;

	// Return capabilities
	return _rtpCapabilities;
}