import type * as MediaSoup from 'mediasoup-client';

/**
 * Possible requests and returned data available through the socket connection
 * requestType: [parameterData, returnedData]
 */
export type MediaRequests = {
	server_rtp_capabilities: [{}, MediaSoup.types.RtpCapabilities];
	transport_producer_create: [
		{ forceTcp: Boolean; rtpCapabilities: MediaSoup.types.RtpCapabilities },
		unknown,
	];
	transport_producer_connect: [
		{ dtlsParameters: MediaSoup.types.DtlsParameters },
		unknown,
	];
	transport_producer_produce: [
		{
			transportId: string;
			kind: MediaSoup.types.MediaKind;
			rtpParameters: MediaSoup.types.RtpParameters;
		},
		{
			id: string;
		},
	];
	transport_receiver_create: [
		{
			forceTcp: false;
			rtpCapabilities: MediaSoup.types.RtpCapabilities;
		},
		{
			id: string;
			iceParameters: MediaSoup.types.IceParameters;
			iceCandidates: MediaSoup.types.IceCandidate[];
			dtlsParameters: MediaSoup.types.DtlsParameters;
		},
	];
	transport_receiver_connect: [
		{ transportId: string; dtlsParameters: MediaSoup.types.DtlsParameters },
		undefined,
	];
	transport_receiver_consume: [
		undefined,
		{
			consumers: Array<{
				socketId: string;
				producerId: string;
				id: string;
				kind: MediaSoup.types.MediaKind;
				rtpParameters: MediaSoup.types.RtpParameters;
			}>;
		},
	];
	transport_receiver_resume: [undefined, undefined];
};
