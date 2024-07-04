import * as MediaSoup from 'mediasoup';
import * as SocketIO from 'socket.io';
import { createWebRTCTransport } from './_webRtcTransport';
import { MediaRequests, MediaLayout } from '../../shared';
import { Repository } from '../../database';

/** Media Repository implementation, keep tracks of media streams */
export class MediaRepository {
	private static _implementation: MediaRepository;
	private _mediaRouter: MediaSoup.types.Router;

	// Linked participant ids
	private _linkedParticipants: Map<string, number> = new Map();

	// Current media layout
	private _mediaLayout: MediaLayout = {
		layout: [],
		curtains: true,
		name: 'curtains',
	};

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
	private _videoProducers: Map<string, MediaSoup.types.Producer>;
	private _audioProducers: Map<string, MediaSoup.types.Producer>;

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
		this._videoProducers = new Map();
		this._audioProducers = new Map();
		// Set as singelton
		MediaRepository._implementation = this;
	}

	// Operations

	public async addAsProducer(
		socketId: string,
		producer: MediaSoup.types.Producer
	) {
		if (producer.kind == 'audio') {
			// Close previous producer
			if (this._audioProducers.has(socketId)) {
				this._audioProducers.get(socketId).close();
			}
			// Update database
			if (this._linkedParticipants.has(socketId)) {
				await Repository._allRepositories['participant'].operate('update', {
					where: { id: this._linkedParticipants.get(socketId)! },
					data: { producingAudio: true },
				});
				Repository._allRepositories['participant'].emitOne(
					Number(this._linkedParticipants.get(socketId)!)
				);
				Repository._allRepositories['participant'].emitAll();
			}
			// Update audio producer collection
			this._audioProducers.set(socketId, producer);
		} else {
			// Close previous producer
			if (this._videoProducers.has(socketId)) {
				this._videoProducers.get(socketId).close();
			}
			// Update database
			if (this._linkedParticipants.has(socketId)) {
				await Repository._allRepositories['participant'].operate('update', {
					where: { id: this._linkedParticipants.get(socketId)! },
					data: { producingVideo: true },
				});
				Repository._allRepositories['participant'].emitOne(
					Number(this._linkedParticipants.get(socketId)!)
				);
				Repository._allRepositories['participant'].emitAll();
			}
			// Update video producer collection
			this._videoProducers.set(socketId, producer);
		}

		// Emit that producers has changed
		console.log(`[MEDIA] ${socketId} is producing new ${producer.kind}`);
		this.io.emit('producers_update');
	}

	public enterParticipant(socketId: string, participantId: number) {
		this._linkedParticipants.set(socketId, participantId);
	}

	/** Remove participant, producer and consumer entries from the given socket id */
	public leaveParticipant(socketId: string) {
		// Remove producer entries
		this.removeAsProducer(socketId, { leaving: true });

		// Remove linked participant id
		this._linkedParticipants.delete(socketId);

		// Remove consumption entries
		this.removeAsConsumer(socketId);
	}

	/** Remove production media entries for a given socket id */
	public async removeAsProducer(
		socketId: string,
		options?: { video?: boolean; audio?: boolean; leaving?: boolean }
	) {
		if (
			// Remove any video or audio producer
			this._videoProducers.has(socketId) ||
			this._audioProducers.has(socketId)
		) {
			if (!options || options.video || options.leaving) {
				this._videoProducers.get(socketId)?.close();
				this._videoProducers.delete(socketId);
				// Update database
				if (this._linkedParticipants.has(socketId)) {
					await Repository._allRepositories['participant'].operate('update', {
						where: { id: this._linkedParticipants.get(socketId)! },
						data: { producingVideo: false },
					});
					Repository._allRepositories['participant'].emitOne(
						Number(this._linkedParticipants.get(socketId)!)
					);
					Repository._allRepositories['participant'].emitAll();
				}
			}
			if (!options || options.audio || options.leaving) {
				this._audioProducers.get(socketId)?.close();
				this._audioProducers.delete(socketId);
				// Update database
				if (this._linkedParticipants.has(socketId)) {
					await Repository._allRepositories['participant'].operate('update', {
						where: { id: this._linkedParticipants.get(socketId)! },
						data: { producingAudio: false },
					});
					Repository._allRepositories['participant'].emitOne(
						Number(this._linkedParticipants.get(socketId)!)
					);
					Repository._allRepositories['participant'].emitAll();
				}
			}

			// Emit that producers has changed
			console.log(`[MEDIA] ${socketId} is no longer a producer`);
			this.io.emit('producers_update');
		}

		// Remove any producer transport
		if (this._producerTransports.has(socketId) && options.leaving) {
			const transport = this._producerTransports.get(socketId)!;
			transport.close();
			this._producerTransports.delete(socketId);
		}
	}

	/** Remove consumption media entries for a given socket id */
	public removeAsConsumer(socketId: string) {
		// Remove any receiver transports for the given socket
		if (this._receiverTransports.has(socketId)) {
			const { transport } = this._receiverTransports.get(socketId)!;
			transport.close();
			this._receiverTransports.delete(socketId);
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
			media_layout: ({ data }) => {
				if (data && data.name) {
					this._mediaLayout = data;
					MediaRepository._io?.emit('media_layout_update', this._mediaLayout);
				}
				return this._mediaLayout;
			},
			server_rtp_capabilities: () => {
				return this._mediaRouter.rtpCapabilities;
			},
			remove_producer: ({ socket, data }) => {
				this.removeAsProducer(socket.id, data);
				return true;
			},
			remove_consumer: ({ socket }) => {
				this.removeAsConsumer(socket.id);
				return true;
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

				this.addAsProducer(socket.id, producer);
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

				for (const [socketId, producer] of [
					...this._videoProducers.entries(),
					...this._audioProducers.entries(),
				]) {
					// Skip self consumption
					if (socket.id == socketId) {
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
							'Can not consume from producer from socket ' + socketId
						);
					}
					const consumer = await transport.consume({
						producerId: producer.id,
						rtpCapabilities: options.rtpCapabilities,
						paused: true,
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
						participantId: this._linkedParticipants.get(socketId)!,
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
