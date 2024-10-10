import type * as MediaSoupClient from 'mediasoup-client';
import { createRTCResponseHandler, createRTCTransport } from '../rtc';
import {
	audioProducers,
	mediaProducerTransports as mediaSendTransports,
	mediaReceiverTransports,
	videoProducers,
} from '../../stores/media';

/** Handles incomming client events for when creating a real time transport is first created */
export const handleRTCTransportCreationRequests = createRTCResponseHandler<
	MediaSoupClient.types.TransportOptions,
	{
		type: 'receiver' | 'sender';
		forceTcp: boolean;
		rtpCapabilities: MediaSoupClient.types.RtpCapabilities;
	}
>(
	'create-rtc-transport',
	async ({ type, forceTcp, rtpCapabilities }, socket) => {
		const map =
			type == 'receiver' ? mediaReceiverTransports : mediaSendTransports;
		const { transport, params } = await createRTCTransport();

		// Destroy and close any previous transport of the same purpose if it exists
		map.delete(socket.id);

		// Store the newly opened transport
		map.set(socket.id, {
			options: { forceTcp, rtpCapabilities },
			transport: transport,
			producers: [],
			consumers: [],
		});

		return params;
	}
);

/** Handles incomming client events for when a send transport is connected */
export const handleRTCTransportConnectionRequests = createRTCResponseHandler<
	void,
	{
		type: 'receiver' | 'sender';
		dtlsParameters: MediaSoupClient.types.DtlsParameters;
	}
>('connect-rtc-transport', async ({ type, dtlsParameters }, socket) => {
	const map =
		type == 'receiver' ? mediaReceiverTransports : mediaSendTransports;
	if (!map.has(socket.id)) {
		throw new Error(`Can't connect non-existing ${type} transport`);
	}
	await map.get(socket.id)!.transport.connect({
		dtlsParameters: dtlsParameters,
	});
});

/** Handles incomming client events for when a send transport starts producing */
export const handleSendTransportProducingRequests = createRTCResponseHandler<
	{
		id: string;
	},
	{
		transportId: string;
		kind: MediaSoupClient.types.MediaKind;
		rtpParameters: MediaSoupClient.types.RtpParameters;
	}
>('send-transport-producing', async ({ kind, rtpParameters }, socket) => {
	if (!mediaSendTransports.has(socket.id)) {
		throw new Error("Can't produce from non-existing producer transport");
	}

	const producer = await mediaSendTransports.get(socket.id)!.transport.produce({
		kind,
		rtpParameters,
	});

	if (producer.kind == 'audio') {
		// Close previous producer
		audioProducers.delete(socket.id);
		// Update audio producer collection
		audioProducers.set(socket.id, producer);
	} else {
		// Close previous producer
		videoProducers.delete(socket.id);
		// Update video producer collection
		videoProducers.set(socket.id, producer);
	}
	return { id: producer.id };
});
