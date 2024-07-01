import type * as MediaSoup from 'mediasoup';
import { Config } from '../../shared/config';

/** Creates and returns a transport object for communicating over WebRTC */
export async function createWebRTCTransport(
	mediaRouter: MediaSoup.types.Router
) {
	const { listenIps, maxIncomingBitrate, initialAvailableOutgoingBitrate } =
		Config.mediasoup.webRTCTransport;

	// Create the transport
	const transport = await mediaRouter.createWebRtcTransport({
		listenIps: listenIps,
		enableUdp: true,
		enableTcp: true,
		preferUdp: true,
		initialAvailableOutgoingBitrate,
	});

	// Optionally limit the incoming bitrate if configured
	if (maxIncomingBitrate) {
		try {
			await transport.setMaxIncomingBitrate(maxIncomingBitrate);
		} catch (error) {}
	}

	return {
		transport,
		params: {
			id: transport.id,
			iceParameters: transport.iceParameters,
			iceCandidates: transport.iceCandidates,
			dtlsParameters: transport.dtlsParameters,
		},
	};
}
