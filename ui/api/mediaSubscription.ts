import * as MediaSoup from 'mediasoup-client';
import type {
	DeviceStatusName,
	MediaEvents,
	MediaRequests,
} from './_connectionTypes';
import { Subscription } from './_subscription';

/** Client side class implementation of the API */
export class MediaSubscription extends Subscription {
	private static _deviceStatus: DeviceStatusName;
	private static _device: MediaSoup.Device;
	private static _localMediaStream: MediaStream | undefined;
	private static _remoteMediaStreams: Array<MediaStream> = [];
	private _rtpCapabilities: MediaSoup.types.RtpCapabilities | undefined;

	protected static getDevice(): MediaSoup.Device {
		if (!this._device) {
			this._device = new MediaSoup.Device();
		}
		return this._device;
	}

	/** Emits a new event to any registered listeners */
	protected static emitLocal<Event extends keyof MediaEvents>(
		event: Event,
		data: MediaEvents[Event]
	) {
		Subscription.getEmitter().emit(event, data);
	}

	/** Sends a request through the socket connection and returns the response from the server */
	private async request<Type extends keyof MediaRequests>(
		type: Type,
		data?: MediaRequests[Type][0]
	) {
		return new Promise<MediaRequests[Type][1]>((resolve, reject) => {
			console.log('[API] requesting', type);
			Subscription.emit(
				type,
				data || {},
				(
					response: (MediaRequests[Type][1] & { error: unknown }) | undefined
				) => {
					if (response && response.error) {
						console.log('[API] response error returned from', type);
						console.error(response.error);
						reject(response.error);
					} else {
						console.log('[API]', type, 'response from server:', response);
						resolve(response as MediaRequests[Type][1]);
					}
				}
			);
		});
	}

	/** Makes sure that the current capabilities are known and loaded */
	private async loadCapabilities() {
		// Load local device and router capabilities
		if (!this._rtpCapabilities) {
			this._rtpCapabilities = await this.request('server_rtp_capabilities');

			// Check necessary capabilities of the browser
			try {
				// Browser media display is not supportered
				if (typeof navigator.mediaDevices.getDisplayMedia === 'undefined') {
					console.error('[API] Browser Display Media is not supported');
					MediaSubscription._deviceStatus = 'unsupported';
				}
				if (!MediaSubscription.getDevice().canProduce('video')) {
					console.error('[API] Browser cannot produce video');
					return;
				}
			} catch (err: any) {
				// Unsupported due to error
				if (err.name === 'UnsupportedError') {
					console.error('[API] Browser is unsupported due to an error thrown');
					MediaSubscription._deviceStatus = 'unsupported';
				}
			}
			// Load given RTP capabilities from the router
			await MediaSubscription.getDevice().load({
				routerRtpCapabilities: this._rtpCapabilities,
			});
		}
	}

	/** Returns the local media stream from the given type */
	private async getLocalMediaStream(type: 'camera' | 'screen') {
		try {
			if (type == 'camera') {
				return await navigator.mediaDevices.getUserMedia({
					video: true,
				});
			}
			if (type == 'screen') {
				return await navigator.mediaDevices.getDisplayMedia({
					video: true,
				});
			}
			throw new Error('Unknown type of local media requested');
		} catch (err) {
			console.error('[API] Failed to get local media stream');
			console.error(err);
			throw err;
		}
	}

	/** Returns the current connection status directly */
	public static get deviceStatus(): DeviceStatusName {
		return MediaSubscription._deviceStatus;
	}

	/** Sets the current device status and emits it to any registered listeners */
	private static set deviceStatus(value: DeviceStatusName) {
		MediaSubscription._deviceStatus = value;
		console.log(`[MEDIA SUBSCRIPTION] device status: ${value}`);
		MediaSubscription.emitLocal('deviceStatus', value);
	}

	/** Returns the current local media stream directly */
	public static get localMediaStream(): MediaStream | undefined {
		return MediaSubscription._localMediaStream;
	}

	/** Sets the current local media stream and emits it to any registered listeners */
	public set localMediaStream(value: MediaStream | undefined) {
		MediaSubscription._localMediaStream = value;
		console.log(`[API] local media stream:`, value);
		MediaSubscription.emitLocal(
			'localMediaStream',
			MediaSubscription._localMediaStream
		);
	}
	/** Returns the current remote media stream directly */
	public static get remoteMediaStreams(): Array<MediaStream> {
		return MediaSubscription._remoteMediaStreams;
	}

	/** Sets the current remote media stream and emits it to any registered listeners */
	public set remoteMediaStreams(value: Array<MediaStream>) {
		MediaSubscription._remoteMediaStreams = value;
		console.log(`[API] remote media stream:`, value);
		MediaSubscription.emitLocal(
			'remoteMediaStreams',
			MediaSubscription._remoteMediaStreams
		);
	}

	/** Returns the current rtp capabilities directly */
	public get rtpCapabilities(): MediaSoup.types.RtpCapabilities {
		return MediaSubscription.getDevice().rtpCapabilities;
	}

	/** Registers a new event listener */
	public static on<Event extends keyof MediaEvents>(
		event: Event,
		handler: (data: MediaEvents[Event]) => void | Promise<void>
	) {
		Subscription.getEmitter().on(event, handler);
	}

	/** Removes an existing event listener */
	public static off<Event extends keyof MediaEvents>(
		event: Event,
		handler: (data: MediaEvents[Event]) => void | Promise<void>
	) {
		Subscription.getEmitter().off(event, handler);
	}

	/** TODO: Document */
	public async publish(type: 'camera' | 'screen') {
		await this.loadCapabilities();

		const sendOptions = await this.request('transport_producer_create', {
			forceTcp: false,
			rtpCapabilities: MediaSubscription.getDevice().rtpCapabilities,
		});
		const transport = await this.createSendTransport(sendOptions);
		// TODO: Make the capabilities check more granular
		const stream = await this.getLocalMediaStream(type);
		const track = stream.getVideoTracks()[0];
		const params = { track };

		// TODO: Re-enable simulcast
		// if (AchkSimulcast.checked) {
		//   params.encodings = [
		//     { maxBitrate: 100000 },
		//     { maxBitrate: 300000 },
		//     { maxBitrate: 900000 },
		//   ];
		//   params.codecOptions = {
		//     videoGoogleStartBitrate: 1000,
		//   };
		// }

		await transport.produce(params);
		this.localMediaStream = stream;
	}

	public async consume() {
		// Get parameters and current
		// const { consumers } = await this.request("producers_update", {
		// 	forceTcp: false,
		// 	rtpCapabilities: this.rtpCapabilities,
		// });
		await this.loadCapabilities();

		// Create a new receiver transport and request consumers
		const params = await this.request('transport_receiver_create', {
			forceTcp: false,
			rtpCapabilities: this.rtpCapabilities,
		});
		const transport = MediaSubscription._device.createRecvTransport(params);
		const { consumers } = await this.request('transport_receiver_consume');

		// Handle new connection event
		transport.on('connect', ({ dtlsParameters }, callback, errback) => {
			console.log('here');
			this.request('transport_receiver_connect', {
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
					console.log('[RECEIVER] connecting...');
					break;

				case 'connected':
					console.log('[RECEIVER] resuming...');
					await this.request('transport_receiver_resume');
					break;
				case 'disconnected':
					console.log('[RECEIVER] disconnected');
					break;

				case 'failed':
					console.log('[RECEIVER] failed to connect');
					transport.close();
					break;

				default:
					throw new Error(
						'Unhandled receiver transport state change: ' + state
					);
			}
		});

		// Start consuming
		const streams: Array<MediaStream> = [];
		for (const { id, producerId, kind, rtpParameters } of consumers) {
			const consumer = await transport.consume({
				id,
				producerId,
				kind,
				rtpParameters,
			});
			const stream = new MediaStream();
			stream.addTrack(consumer.track);
			streams.push(stream);
		}
		this.remoteMediaStreams = streams;
	}

	public async createSendTransport(options: any) {
		const transport =
			MediaSubscription.getDevice().createSendTransport(options);
		transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
			this.request('transport_producer_connect', { dtlsParameters })
				.then(callback)
				.catch(errback);
		});

		transport.on(
			'produce',
			async ({ kind, rtpParameters }, callback, errback) => {
				try {
					const { id } = await this.request('transport_producer_produce', {
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

		transport.on('connectionstatechange', (state) => {
			switch (state) {
				case 'connecting':
					// TODO: report status
					console.log('publishing...');
					// AtxtPublish.innerHTML = "publishing...";
					// AfsPublish.disabled = true;
					// AfsSubscribe.disabled = true;
					break;

				case 'connected':
					// TODO: local stream
					//document.querySelector("#local_video").srcObject = stream;
					// TODO: report status
					console.log('published');
					// AtxtPublish.innerHTML = "published";
					// AfsPublish.disabled = true;
					// AfsSubscribe.disabled = false;
					break;

				case 'failed':
					console.log('failed');
					transport.close();
					// TODO: report status
					// AtxtPublish.innerHTML = "failed";
					// AfsPublish.disabled = false;
					// AfsSubscribe.disabled = true;
					break;
				case 'closed':
				case 'disconnected':
				case 'new':
				default:
					console.log('TODO:', 'unhandled transport state', state);
					break;
			}
		});

		// Return the transport
		return transport;
	}
}
