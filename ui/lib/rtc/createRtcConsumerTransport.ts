import { mediaRequest } from '../operations';
import { rtpCapabilities, mediaDevice } from '~/lib/api';

/**
 * Creates and returns a transport object for consuming media from the server over WebRTC
 * A unique consumer- (a.k.a. receiver-) transport is created for each producer on the server side
 */
export async function createRTCConsumerTransport() {
	// Make sure we have loaded capabilities
	// and initialized a local media device
	let _rtpCapabilities = await rtpCapabilities();

	// Create a new receiver transport and request consumers
	const params = await mediaRequest('transport_receiver_create', {
		forceTcp: false,
		rtpCapabilities: _rtpCapabilities,
	});
	const transport = mediaDevice().createRecvTransport(params);

	// Handle new connection event
	transport.on('connect', ({ dtlsParameters }, callback, errback) => {
		mediaRequest('transport_receiver_connect', {
			transportId: transport.id,
			dtlsParameters,
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
