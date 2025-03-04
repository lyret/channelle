import type * as MediaSoup from 'mediasoup-client';
import { createRtcRequest } from '../rtc';

/** Sends a request with data neccessary to create a transport and that returns the options the client needs to create and open the transport on the client side */
export const requestRTCTransportCreation = createRtcRequest<
	MediaSoup.types.TransportOptions,
	{
		type: 'receiver' | 'sender';
		forceTcp: boolean;
		rtpCapabilities: MediaSoup.types.RtpCapabilities;
	}
>('create-rtc-transport');

/** Sends a request with additional data neccessary to connect a transport between the server and client */
export const onRTCTransportConnectingRequest = createRtcRequest<
	void,
	{
		type: 'receiver' | 'sender';
		dtlsParameters: MediaSoup.types.DtlsParameters;
	}
>('connect-rtc-transport');

/** Sends a request with additional data neccessary to start production over a send transport, returns the producer id */
export const onTransportConnectingProducingRequest = createRtcRequest<
	{
		id: string;
	},
	{
		transportId: string;
		kind: MediaSoup.types.MediaKind;
		rtpParameters: MediaSoup.types.RtpParameters;
	}
>('send-transport-producing');
