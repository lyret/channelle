import { mediaRequest } from '../operations';
import { rtpCapabilities, mediaDevice, ws } from '~/lib/api';
import {
	onRTCTransportConnectingRequest,
	requestRTCTransportCreation,
} from '../requests/transportRequests';

/**
 * Creates and returns a transport object for receiving media from the server over WebRTC
 * A unique consumer- (a.k.a. receiver-) transport is created for each producer on the server side
 */
export async function createRTCReceiverTransport() {
	// Make sure we have loaded capabilities
	// and initialized a local media device
	let _rtpCapabilities = await rtpCapabilities();

	// Get websocket connection
	const _socket = ws();

	// Create a new receiver transport and request consumers
	const params = await requestRTCTransportCreation(_socket, {
		type: 'receiver',
		forceTcp: false,
		rtpCapabilities: _rtpCapabilities,
	});

	params.id;
	const transport = mediaDevice().createRecvTransport(params);

	// Handle new connection event
	transport.on('connect', ({ dtlsParameters }, callback, errback) => {
		onRTCTransportConnectingRequest(_socket, {
			dtlsParameters,
			type: 'receiver',
		})
			.then(callback)
			.catch(errback);
	});

	// Handle other connection state changes
	transport.on('connectionstatechange', async (state) => {
		switch (state) {
			case 'connecting':
				console.log(`[RECEIVER TRANSPORT ${transport.id}] connecting...`);
				break;

			case 'connected':
				console.log(`[RECEIVER TRANSPORT ${transport.id}] resuming...`);
				await mediaRequest('transport_receiver_resume');
				break;
			case 'disconnected':
				console.log(`[RECEIVER TRANSPORT ${transport.id}] disconnected`);
				break;

			case 'failed':
				console.log(`[RECEIVER TRANSPORT ${transport.id}] failed to connect`);
				transport.close();
				break;

			default:
				throw new Error('Unhandled receiver transport state change: ' + state);
		}
	});

	// return the transport
	return transport;
}
