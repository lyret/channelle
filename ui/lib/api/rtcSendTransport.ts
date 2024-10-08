import * as MediaSoup from 'mediasoup-client';
import { rtpCapabilities } from './rtpCapabilities';
import { mediaRequest } from '../operations'; // TODO: Remove this import
import { mediaDevice } from './mediaDevice';

/** Global RTC Send Transport */
let _sendTransport: MediaSoup.types.Transport | undefined = undefined;

/** Returns a globaly reusable transport object for sending multimedia over web rtc  */
export async function rtcSendTransport(): Promise<MediaSoup.types.Transport> {
	// Return already existing send transport
	if (_sendTransport) {
		return _sendTransport;
	}

	// Make sure we have loaded capabilities
	// and initialized a local media device
	let _rtpCapabilities = await rtpCapabilities();

	// Get send options from the server
	const sendOptions = await mediaRequest('transport_producer_create', {
		forceTcp: false,
		rtpCapabilities: _rtpCapabilities,
	});

	// Create the send transport
	const transport = mediaDevice().createSendTransport(sendOptions);

	// Connect and supply the dtls parameters to the server
	transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
		mediaRequest('transport_producer_connect', { dtlsParameters })
			.then(callback)
			.catch(errback);
	});

	// Handle produce events - that is when media is sent over this transport
	transport.on(
		'produce',
		async ({ kind, rtpParameters }, callback, errback) => {
			try {
				const { id } = await mediaRequest('transport_producer_produce', {
					transportId: transport.id,
					kind,
					rtpParameters,
				});
				callback({ id });
			} catch (err: any) {
				errback(err);
			}
		}
	);

	// Handle connection state change events
	transport.on('connectionstatechange', (state) => {
		switch (state) {
			case 'connecting':
				console.log(`[SEND TRANSPORT #${transport.id} ] Connecting...`);
				break;

			case 'connected':
				console.log(`[SEND TRANSPORT #${transport.id} ] Connected!`);
				break;

			case 'failed':
				console.log(`[SEND TRANSPORT #${transport.id} ] Failed...`);
				transport.close();
				break;

			case 'closed':
				console.log(`[SEND TRANSPORT #${transport.id} ] Closed`);
				transport.close();
				break;

			case 'disconnected':
				console.log(`[SEND TRANSPORT #${transport.id} ] Disconnected`);
				transport.close();
				break;

			case 'new':
				console.log(`[SEND TRANSPORT #${transport.id} ] New...`);
				transport.close();
				break;

			default:
				throw new Error('Unhandled send transport state change: ' + state);
		}
	});

	// Return the transport
	_sendTransport = transport;
	return _sendTransport;
}
