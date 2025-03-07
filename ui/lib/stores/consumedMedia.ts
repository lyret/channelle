import type * as MediaSoup from "mediasoup-client";
import { readable } from "svelte/store";
import { ws } from "~/lib/api";
import type { DataTypes } from "../_databaseTypes";
import { mediaRequest } from "../operations";
import { createRTCReceiverTransport, createRtcRequest } from "../rtc";
import { currentParticipant } from "./api";
import { localMedia } from "./producedMedia";

/**
 * The consumed media store provides all media streams that should be either seen or heard, both from this client and from the MediaSoup server
 */
export const ConsumedMediaStore = createConsumedMediaStore();

// TODO: document
function createConsumedMediaStore(): ConsumedMediaStore {
	const _socket = ws();
	let _transport: MediaSoup.types.Transport<MediaSoup.types.AppData>;
	const _transportPromise = new Promise<void>((resolve) => {
		const int = setInterval(() => {
			if (_transport) {
				clearInterval(int);
				resolve();
			}
		}, 1000);
	});

	// Create the transport
	// TODO: currently using 1 receiver transport for everything?
	createRTCReceiverTransport().then((transport) => {
		_transport = transport;
	});

	const _value: ConsumedMediaStoreValue = [];

	const { subscribe } = readable(_value, function start(_set) {
		// Subscribe to the current participant so that any local device stream can be added to the media layout
		let _currentParticipant: DataTypes["participant"] | undefined;
		let _localVideoStream: MediaStream | undefined;
		const _isConsuming: boolean = false;

		// Consume any new media stream produced on the media soup server
		const _onConsume = async () => {
			if (!_transport) {
				await _transportPromise;
			}
			const newValue: ConsumedMediaStoreValue = [];

			// Get new data
			const req = createRtcRequest<{
				availableConsumptions: Array<any>; // TODO: Array<StageLayoutActorWithProducer>;
			}>("transport_receiver_consume");

			// Consume all remote media with the receiver transport
			const { availableConsumptions } = await req(_socket, {});

			for (const {
				socketId,
				producerId,
				participantId,
				participant,
				id,
				kind,
				rtpParameters,
				type,
				producerPaused,
			} of availableConsumptions) {
				// Create the media stream
				const stream = new MediaStream();
				// Start consuming
				await _transport
					.consume({
						id,
						producerId,
						kind,
						rtpParameters,
					})
					.then((consumer) => {
						if (!consumer.paused) {
							stream.addTrack(consumer.track);
							newValue.push({ stream, participant, kind });
						}
					});
			}
			await mediaRequest("transport_receiver_resume");

			if (_currentParticipant && _localVideoStream) {
				newValue.push({
					kind: "video",
					participant: _currentParticipant,
					stream: _localVideoStream,
				});
			}
			_set(newValue);
		};

		// Re-consume when producers update
		_socket.on("producers_update", _onConsume);

		_socket.on("audio_producers_update", (data) => {
			console.log("audio_producers_update", data);
		});
		//_socket.on('video_producers_update', _onConsume);

		// Subscribe to the current participation status so that TODO: why? explain!
		const _stopCurrentParticipantSubscription = currentParticipant.subscribe(
			($currentParticipant) => {
				_currentParticipant = $currentParticipant?.id
					? $currentParticipant
					: undefined;

				if (_transport || !$currentParticipant) {
					_onConsume();
				}
			}
		);

		// Subscribe to the current video publishing status so that we can include the local video stream in the layout
		const _stopDeviceVideoSubscription = localMedia.subscribe(($localMedia) => {
			_localVideoStream = $localMedia.video.stream;

			if (_transport && $localMedia.video.stream) {
				_onConsume();
			}
		});

		// Consume any already producing media stream
		_onConsume();

		return function stop() {
			_stopCurrentParticipantSubscription();
			_stopDeviceVideoSubscription();
			_socket.off("producers_update", _onConsume);
			mediaRequest("remove_consumer");
		};
	});

	return {
		subscribe: subscribe,
	};
}

/** Consumed Media Store Value */
export type ConsumedMediaStoreValue = Array<{
	kind: "audio" | "video" | undefined;
	participant: DataTypes["participant"];
	stream: MediaStream;
}>;

/** Consumed Media Store Interface */
interface ConsumedMediaStore {
	subscribe: (handler: (value: ConsumedMediaStoreValue) => void) => () => void;
}
