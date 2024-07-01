import * as MediaSoup from 'mediasoup';
import * as SocketIO from 'socket.io';
import { createWebRTCTransport } from './_webRtcTransport';
import { MediaRequests } from '../../shared';

/** Media Repository implementation, keep tracks of media streams */
export class MediaRepository {
	private static _implementation: MediaRepository;
	private _mediaRouter: MediaSoup.types.Router;

	// Media entries
	private _producerTransports: Map<string, MediaSoup.types.WebRtcTransport>;
	private _receiverTransports: Map<
		string,
		{
			options: MediaRequests['transport_receiver_create'][0];
			transport: MediaSoup.types.WebRtcTransport;
			consumers: Array<MediaSoup.types.Consumer>;
		}
	>;
	private _producers: Map<string, MediaSoup.types.Producer>;

	// Shared IO server between all repositories

	private static _io: SocketIO.Server;

	protected get io(): SocketIO.Server {
		if (!MediaRepository._io) {
			throw new Error('No IO Server exists!');
		}
		return MediaRepository._io;
	}

	public static setIO(io: SocketIO.Server): void {
		this._io = io;
	}

	// Shared accessible singleton class instance
	public static get Singelton() {
		return MediaRepository._implementation;
	}

	// Constructor

	constructor(mediaRouter: MediaSoup.types.Router) {
		// Create attributes
		this._mediaRouter = mediaRouter;
		this._producerTransports = new Map();
		this._receiverTransports = new Map();
		this._producers = new Map();
		// Set as singelton
		MediaRepository._implementation = this;
	}

	// CRUD Operations

	/** Remove the media entries for a given id */
	public remove(id: string) {
		// Remove producer entry
		if (this._producers.has(id)) {
			this._producers.delete(id);
			console.log(`[MEDIA] ${id} no`);
		}

		// Remove any receiver transport
		if (this._receiverTransports.has(id)) {
			const { transport } = this._receiverTransports.get(id)!;
			transport.close();
			this._receiverTransports.delete(id);
		}
	}

	/**
	 * Implements each possible media request defined in the common client/server interface
	 * Each request handler will receive the incoming data as well as the socket making the request
	 */
	public requestHandlers(): {
		[Type in keyof MediaRequests]: (input: {
			data: MediaRequests[Type][0];
			socket: SocketIO.Socket;
		}) => Promise<MediaRequests[Type][1]> | MediaRequests[Type][1];
	} {
		return {
			// NOTE: should be removed and replaced with a "sign in" or "on connection"
			server_rtp_capabilities: () => {
				return this._mediaRouter.rtpCapabilities;
			},
			transport_producer_create: async ({ socket }) => {
				const { transport, params } = await createWebRTCTransport(
					this._mediaRouter
				);
				this._producerTransports.set(socket.id, transport);
				return params;
			},
			transport_producer_produce: async ({ data, socket }) => {
				const { kind, rtpParameters } = data;

				if (!this._producerTransports.has(socket.id)) {
					throw new Error("Can't produce from non-existing producer transport");
				}

				// TODO: Producers are not stored anywhere here
				const producer = await this._producerTransports
					.get(socket.id)!
					.produce({
						kind,
						rtpParameters,
					});

				this._producers.set(socket.id, producer);
				//this.io.emit('producers_update', results);
				return { id: producer.id };
			},
			transport_producer_connect: async ({ data, socket }) => {
				if (!this._producerTransports.has(socket.id)) {
					throw new Error("Can't connect non-existing producer transport");
				}
				await this._producerTransports.get(socket.id)!.connect({
					dtlsParameters: data.dtlsParameters,
				});
				return undefined;
			},
			transport_receiver_create: async ({ data, socket }) => {
				// Destroy previous transport if it exists
				if (this._receiverTransports.has(socket.id)) {
					const { transport } = this._receiverTransports.get(socket.id)!;
					transport.close();
				}

				// Create a new transport
				const { transport, params } = await createWebRTCTransport(
					this._mediaRouter
				);
				this._receiverTransports.set(socket.id, {
					options: data,
					transport: transport,
					consumers: [],
				});

				// Return parameters
				return params;
			},
			transport_receiver_consume: async ({ socket }) => {
				// Fail if no transport exists
				if (!this._receiverTransports.has(socket.id)) {
					throw new Error("Can't connect a non-existing receiver transport");
				}
				const { options, transport } = this._receiverTransports.get(socket.id)!;
				const results: MediaRequests['transport_receiver_consume'][1]['consumers'] =
					[];
				const consumers: Array<MediaSoup.types.Consumer> = [];

				for (const [userId, producer] of this._producers.entries()) {
					// Skip self consumption
					if (socket.id == userId) {
						continue;
					}
					// Fail if unable to consume
					if (
						!this._mediaRouter.canConsume({
							producerId: producer.id,
							rtpCapabilities: options.rtpCapabilities,
						})
					) {
						throw new Error(
							'Can not consume from producer from user ' + userId
						);
					}
					const consumer = await transport.consume({
						producerId: producer.id,
						rtpCapabilities: options.rtpCapabilities,
						paused: producer.kind === 'video',
					});
					// TODO: re-enable simulcast
					// if (consumer.type === "simulcast") {
					// 	await consumer.setPreferredLayers({
					// 		spatialLayer: 2,
					// 		temporalLayer: 2,
					// 	});
					// }

					results.push({
						socketId: socket.id,
						producerId: producer.id,
						id: consumer.id,
						kind: consumer.kind,
						rtpParameters: consumer.rtpParameters,
						//type: consumer.type,
						//producerPaused: consumer.producerPaused,
					});
					consumers.push(consumer);
				}

				// Save and return consumers
				this._receiverTransports.set(socket.id, {
					options,
					transport,
					consumers,
				});
				return { consumers: results };
			},
			transport_receiver_connect: async ({ data, socket }) => {
				// Fail if no transport exists
				if (!this._receiverTransports.has(socket.id)) {
					throw new Error("Can't connect a non-existing receiver transport");
				}

				// Connect it
				const { transport } = this._receiverTransports.get(socket.id)!;
				await transport.connect({
					dtlsParameters: data.dtlsParameters,
				});

				// Return
				return undefined;
			},
			transport_receiver_resume: async ({ socket }) => {
				// Fail if no transport exists
				if (!this._receiverTransports.has(socket.id)) {
					throw new Error("Can't resume a non-existing receiver transport");
				}
				const { consumers } = this._receiverTransports.get(socket.id)!;

				for (const consumer of consumers) {
					await consumer.resume();
				}
				return undefined;
			},
		};
	}
}
