import { mediaSoup } from '../api';

/** Creates and returns a transport object for communicating with clients over WebRTC */
export async function createRTCTransport() {
	const { listenIps, maxIncomingBitrate, initialAvailableOutgoingBitrate } =
		CONFIG.mediasoup.webRTCTransport;

	// Get the router
	const { router } = await mediaSoup();

	// Create the transport
	const transport = await router.createWebRtcTransport({
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
