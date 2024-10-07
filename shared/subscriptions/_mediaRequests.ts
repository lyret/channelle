import type * as MediaSoup from 'mediasoup-client';

/**
 * Possible requests and returned data available through the socket connection
 * requestType: [parameterData, returnedData]
 */
export type MediaRequests = {
	effects_trigger: [undefined, Record<string, number>];
	effects_add: [{ type: string; number: number }, undefined];
	server_rtp_capabilities: [{}, MediaSoup.types.RtpCapabilities];
	remove_producer: [{ audio?: boolean; video?: boolean }, boolean];
	remove_consumer: [{}, boolean];
	transport_producer_create: [
		{ forceTcp: Boolean; rtpCapabilities: MediaSoup.types.RtpCapabilities },
		MediaSoup.types.TransportOptions,
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
				participantId: number;
			}>;
		},
	];
	transport_receiver_resume: [undefined, undefined];
};
