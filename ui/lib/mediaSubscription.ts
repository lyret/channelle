import * as MediaSoup from 'mediasoup-client';
import Emittery from 'emittery';
import { Subscription } from './_subscription';
import { request } from './operations';

/** Available events emitted from the API class implementation */
export type SubscriptionMediaEvents = {
	/** Possible browser / device status */
	deviceStatus: 'unknown' | 'unsupported' | 'ok';
	/** Indicates that this device is consuming */
	isConsuming: boolean;
	/** Indicates that this device is producing video */
	isProducingVideo: boolean;
	/** Indicates that this device is producing audio */
	isProducingAudio: boolean;
	/** Any media stream generated from this device */
	localMediaStream: MediaStream | undefined;
	/** Any media streams coming in from other connected users */
	remoteMediaStreams: Record<number, MediaStream>;
};

/** Client side class implementation of the API */
export class MediaSubscription extends Subscription {
	private static _mediaEventEmitter: Emittery<SubscriptionMediaEvents> =
		new Emittery();
	private static _videoProducer: MediaSoup.types.Producer;
	private static _audioProducer: MediaSoup.types.Producer;
	private static _values: SubscriptionMediaEvents = {
		deviceStatus: 'unknown',
		isConsuming: false,
		isProducingVideo: false,
		isProducingAudio: false,
		localMediaStream: undefined,
		remoteMediaStreams: {},
	};
	private static _sendTransport: MediaSoup.types.Transport | undefined =
		undefined;
	private static _device: MediaSoup.Device | undefined = undefined;
	private static _rtpCapabilities: MediaSoup.types.RtpCapabilities | undefined =
		undefined;

	/** Returns the current device, or initializes it */
	public static get device(): MediaSoup.Device {
		if (!this._device) {
			this._device = new MediaSoup.Device();
		}
		return this._device;
	}

	/** Returns the current Rtp capabilities, or initializes them */
	public static get rtpCapabilities(): MediaSoup.types.RtpCapabilities {
		if (!this._rtpCapabilities) {
			this._rtpCapabilities = MediaSubscription.device.rtpCapabilities;
		}
		return this._rtpCapabilities;
	}

	/** Sets the current device status and emits it to any registered listeners */
	private static set deviceStatus(
		value: SubscriptionMediaEvents['deviceStatus']
	) {
		MediaSubscription._values.deviceStatus = value;
		console.log(`[Media Subscription] device status: ${value}`);
		this.mediaEmit('deviceStatus', value);
	}

	/** Sets the current consuming status directly and emits it to any registered listeners */
	private static set isConsuming(
		value: SubscriptionMediaEvents['isConsuming']
	) {
		MediaSubscription._values.isConsuming = value;
		console.log(`[Media Subscription] consuming: ${value}`);
		this.mediaEmit('isConsuming', value);
	}

	/** Sets the current video producing status directly and emits it to any registered listeners */
	private static set isProducingVideo(
		value: SubscriptionMediaEvents['isProducingVideo']
	) {
		if (this._videoProducer) {
			if (!value) {
				this._videoProducer.pause();
				request('remove_producer', { video: true });
			} else {
				this._videoProducer.resume();
			}
		}
		MediaSubscription._values.isProducingVideo = value;
		console.log(`[Media Subscription] producing video: ${value}`);
		this.mediaEmit('isProducingVideo', value);
	}
	/** Sets the current audio producing status directly and emits it to any registered listeners */
	private static set isProducingAudio(
		value: SubscriptionMediaEvents['isProducingAudio']
	) {
		if (this._audioProducer) {
			if (!value) {
				this._audioProducer.pause();
				request('remove_producer', { audio: true });
			} else {
				this._audioProducer.resume();
			}
		}
		MediaSubscription._values.isProducingAudio = value;
		console.log(`[Media Subscription] producing audio: ${value}`);
		this.mediaEmit('isProducingAudio', value);
	}

	/** Sets the current local media stream and emits it to any registered listeners */
	public static set localMediaStream(value: MediaStream | undefined) {
		MediaSubscription._values.localMediaStream = value;
		console.log(`[Media Subscription] local media stream:`, value);
		this.mediaEmit(
			'localMediaStream',
			MediaSubscription._values.localMediaStream
		);
	}

	/** Sets the current remote media streams and emits them to any registered listeners */
	public static set remoteMediaStreams(value: Record<string, MediaStream>) {
		MediaSubscription._values.remoteMediaStreams = value;
		console.log(`[Media Subscription] remote media streams:`, value);
		this.mediaEmit(
			'remoteMediaStreams',
			MediaSubscription._values.remoteMediaStreams
		);
	}

	// Media Emittance

	public static mediaEmit<Key extends keyof SubscriptionMediaEvents>(
		event: Key,
		data: SubscriptionMediaEvents[Key]
	) {
		this._mediaEventEmitter.emit(event, data);
	}

	public static mediaOn<Key extends keyof SubscriptionMediaEvents>(
		event: Key,
		handler: (data: SubscriptionMediaEvents[Key]) => void | Promise<void>
	) {
		this._mediaEventEmitter.on(event, handler);
	}

	public static mediaOff<Key extends keyof SubscriptionMediaEvents>(
		event: Key,
		handler: (data: SubscriptionMediaEvents[Key]) => void | Promise<void>
	) {
		this._mediaEventEmitter.off(event, handler);
	}

	public static mediaGet<Key extends keyof SubscriptionMediaEvents>(
		event: Key
	): SubscriptionMediaEvents[Key] {
		return this._values[event];
	}

	// Static Methods

	/** Makes sure that the current capabilities are known and loaded */
	private static async loadCapabilities() {
		// Load local device and router capabilities
		if (!this._rtpCapabilities) {
			this._rtpCapabilities = await request('server_rtp_capabilities');

			// Check necessary capabilities of the browser
			try {
				// Browser media display is not supportered
				if (typeof navigator.mediaDevices.getDisplayMedia === 'undefined') {
					console.error(
						'[Media Subscription] Browser Display Media is not supported'
					);
					MediaSubscription.deviceStatus = 'unsupported';
				}
				if (!MediaSubscription.device.canProduce('video')) {
					console.error('[Media Subscription] Browser cannot produce video');
					return;
				}
			} catch (err: any) {
				// Unsupported due to error
				if (err.name === 'UnsupportedError') {
					console.error(
						'[Media Subscription] Browser is unsupported due to an error thrown'
					);
					MediaSubscription.deviceStatus = 'unsupported';
				}
			}
			// Load given RTP capabilities from the router
			await MediaSubscription.device.load({
				routerRtpCapabilities: this._rtpCapabilities,
			});
		}
	}

	/** Returns the local media stream from the given type */
	private static async getLocalMediaStream(
		source: 'camera' | 'screen' | 'audio'
	) {
		try {
			if (source == 'audio') {
				return await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
			}
			if (source == 'camera') {
				return await navigator.mediaDevices.getUserMedia({
					video: true,
				});
			}
			if (source == 'screen') {
				return await navigator.mediaDevices.getDisplayMedia({
					video: true,
				});
			}
			throw new Error('Unknown type of local media requested');
		} catch (err) {
			console.error('[Media Subscription] Failed to get local media stream');
			console.error(err);
			throw err;
		}
	}

	/** Creates and return a send transport, or use the existing one  */
	private static async createSendTransport() {
		if (this._sendTransport) {
			return this._sendTransport;
		}
		const sendOptions = await request('transport_producer_create', {
			forceTcp: false,
			rtpCapabilities: this.rtpCapabilities,
		});

		const transport = this.device.createSendTransport(sendOptions);
		transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
			request('transport_producer_connect', { dtlsParameters })
				.then(callback)
				.catch(errback);
		});

		transport.on(
			'produce',
			async ({ kind, rtpParameters }, callback, errback) => {
				try {
					const { id } = await request('transport_producer_produce', {
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
					console.log('[Media Subscription] Send Transport Publishing...');
					// AtxtPublish.innerHTML = "publishing...";
					// AfsPublish.disabled = true;
					// AfsSubscribe.disabled = true;
					break;

				case 'connected':
					// TODO: local stream
					//document.querySelector("#local_video").srcObject = stream;
					// TODO: report status
					console.log('[Media Subscription] Send Transport Published');
					// AtxtPublish.innerHTML = "published";
					// AfsPublish.disabled = true;
					// AfsSubscribe.disabled = false;
					break;

				case 'failed':
					console.log('[Media Subscription] Send Transport Failed');
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
					console.log(
						'[Media Subscription] TODO:',
						'unhandled transport state',
						state
					);
					break;
			}
		});

		// Return the transport
		this._sendTransport = transport;
		return transport;
	}

	// Start / Stop

	/** Creates a receiver transport to all the current publishing remote sources */
	public static async consume() {
		// Make sure to auto update when producers are changed on the server
		if (!this._values.isConsuming) {
			this.isConsuming = true;
			Subscription.socketOn('producers_update', this.consume.bind(this));
		}

		// Make sure we have loaded capabilities

		await this.loadCapabilities();

		// Create a new receiver transport and request consumers
		const params = await request('transport_receiver_create', {
			forceTcp: false,
			rtpCapabilities: this.rtpCapabilities,
		});
		const transport = MediaSubscription.device.createRecvTransport(params);
		const { consumers } = await request('transport_receiver_consume');

		// Handle new connection event
		transport.on('connect', ({ dtlsParameters }, callback, errback) => {
			console.log('HERE', 'transport_receiver_connect');
			request('transport_receiver_connect', {
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
					await request('transport_receiver_resume');
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
		const streams: Record<string, MediaStream> = {};
		for (const {
			id,
			producerId,
			kind,
			rtpParameters,
			participantId,
		} of consumers) {
			const consumer = await transport.consume({
				id,
				producerId,
				kind,
				rtpParameters,
			});
			streams[participantId] = streams[participantId] || new MediaStream();
			streams[participantId].addTrack(consumer.track);
		}
		this.remoteMediaStreams = streams;
	}

	public static async stopConsume() {
		if (this._values.isConsuming) {
			this.isConsuming = false;
			await request('remove_consumer');
			Subscription.socketOff('producers_update', this.consume.bind(this));
		}
	}

	/** Starts publishing video */
	public static async publishVideo() {
		await this.loadCapabilities();
		const transport = await this.createSendTransport();

		// TODO: Make the capabilities check more granular
		const videoStream = await this.getLocalMediaStream('camera');
		const track = videoStream.getVideoTracks()[0];
		//const audioTrack = audioStream.getAudioTracks()[0];

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

		this.isProducingVideo = true;
		this._videoProducer = await transport.produce({ track });
		//await transport.produce({ track: audioTrack });
		this.localMediaStream = videoStream;
	}
	public static async stopPublishVideo() {
		this.isProducingVideo = false;
	}

	/** Starts publishing audio */
	public static async publishAudio() {
		await this.loadCapabilities();
		const transport = await this.createSendTransport();

		const audioStream = await this.getLocalMediaStream('audio');
		const track = audioStream.getAudioTracks()[0];

		this.isProducingAudio = true;
		this._audioProducer = await transport.produce({ track });
	}
	public static async stopPublishAudio() {
		this.isProducingAudio = false;
	}
}
