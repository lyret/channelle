import type * as MediaSoup from 'mediasoup-client';
import { readable } from 'svelte/store';
import { mediaRequest } from '../operations';
import { ws } from '~/lib/api';
import { createRTCReceiverTransport, createRtcRequest } from '../rtc';
import type { DataTypes } from '../_databaseTypes';
import type {
	StageLayoutWithProducers,
	StageLayoutActorWithProducer,
} from '~/../server/createIOEventHandlers';
import { currentParticipant } from './api';
import { localMedia } from './localMedia';

/**
 * The Media store provides all media streams, both from this client and from the MediaSoup server
 */
export const MediaStore = createMediaStore();

/** Creates a Svelte Store for consuming MediaSoup streams from the server */
function createMediaStore(): MediaStore {
	const _socket = ws();
	let _value: MediaStoreValue = {
		layout: [],
		isAutoLayout: true,
		leftovers: [],
	};
	let _isConsuming: boolean = false;

	const { subscribe } = readable(_value, function start(_set) {
		// Subscribe to the current participant so that any local device stream can be added to the media layout
		let _currentPartipant: DataTypes['participant'] | undefined;
		let _localVideoStream: MediaStream | undefined;
		const _stopCurrentParticipantSubscription = currentParticipant.subscribe(
			($currentParticipant) =>
				(_currentPartipant = $currentParticipant.id
					? $currentParticipant
					: undefined)
		);
		// Subscribe to the current video publishing status so that we can include the local video stream in the layout
		const _stopDeviceVideoSubscription = localMedia.subscribe(($localMedia) => {
			_localVideoStream = $localMedia.video.stream;
			_set(_value);
		});

		// Consume any new media stream produced on the media soup server
		const _onConsume = async () => {
			const transport = await createRTCReceiverTransport();
			// Get new data
			const req = createRtcRequest<{
				layout: StageLayoutWithProducers;
				leftovers: Array<StageLayoutActorWithProducer>;
			}>('transport_receiver_consume');
			const { layout, leftovers } = await req(_socket, {});

			// Create a updated layout with streams
			const isAutoLayout = !layout.length;
			let localStreamIsNotALeftover = false;
			const updatedLayout: StageLayoutWithStreams = [];
			const updatedLeftovers: Array<StageLayoutActorWithStream> = [];

			for (const row of layout) {
				const updatedRow: StageLayoutWithStreams[number] = [];
				for (const cell of row) {
					if (cell.type == 'actor') {
						// Start consuming
						if (cell.production && cell.production.length) {
							const stream = new MediaStream();
							for (const {
								id,
								producerId,
								kind,
								rtpParameters,
							} of cell.production) {
								await transport
									.consume({
										id,
										producerId,
										kind,
										rtpParameters,
									})
									.then((consumer) => {
										if (!consumer.paused) {
											stream.addTrack(consumer.track);
										}
									});
							}
							updatedRow.push({
								type: 'actor',
								id: cell.id,
								participant: cell.participant,
								stream,
							});
						} else if (_currentPartipant && cell.id == _currentPartipant.id) {
							localStreamIsNotALeftover = true;
							updatedRow.push({
								type: 'actor',
								id: cell.id,
								participant: cell.participant,
								stream: _localVideoStream,
							});
						} else {
							updatedRow.push({
								type: 'actor',
								id: cell.id,
								participant: cell.participant,
							});
						}
					} else {
						updatedRow.push(cell);
					}
				}
				updatedLayout.push(updatedRow);
			}

			for (const cell of leftovers) {
				// Start consuming
				if (cell.production && cell.production.length) {
					const stream = new MediaStream();
					for (const {
						id,
						producerId,
						kind,
						rtpParameters,
					} of cell.production) {
						await transport
							.consume({
								id,
								producerId,
								kind,
								rtpParameters,
							})
							.then((consumer) => {
								stream.addTrack(consumer.track);
							});
					}
					updatedLeftovers.push({
						type: 'actor',
						id: cell.id,
						participant: cell.participant,
						stream,
					});
				} else {
					updatedLeftovers.push({
						type: 'actor',
						id: cell.id,
						participant: cell.participant,
					});
				}
			}

			if (
				!localStreamIsNotALeftover &&
				_currentPartipant &&
				_localVideoStream
			) {
				updatedLeftovers.push({
					type: 'actor',
					id: _currentPartipant.id,
					participant: _currentPartipant,
					stream: _localVideoStream,
				});
			}

			_value = {
				layout: updatedLayout,
				isAutoLayout,
				leftovers: updatedLeftovers,
			};

			_isConsuming = true;
			_set(_value);
		};
		_socket.on('producers_update', _onConsume);

		// Consume any already producing media stream
		_onConsume();

		return function stop() {
			_stopCurrentParticipantSubscription();
			_stopDeviceVideoSubscription();
			_isConsuming = false;
			_socket.off('producers_update', _onConsume);
			mediaRequest('remove_consumer');
		};
	});

	return {
		subscribe: subscribe,
		isConsuming: () => _isConsuming,
	};
}

/** Media Store Value */
// export type MediaStoreValue = Record<
// 	number,
// 	{ participant?: DataTypes['participant']; stream: MediaStream }
// >;
export type MediaStoreValue = {
	isAutoLayout: boolean;
	layout: StageLayoutWithStreams;
	leftovers: Array<StageLayoutActorWithStream>;
};

/** Media Store Interface */
interface MediaStore {
	isConsuming: () => boolean;
	subscribe: (handler: (value: MediaStoreValue) => void) => () => void;
}
// FIXME: type madness
export type StageLayoutWithStreams = Array<
	Array<StageLayoutActorWithStream | { type: 'chat' } | { type: 'empty' }>
>;

export type StageLayoutActorWithStream = {
	type: 'actor';
	participant: DataTypes['participant'];
	id: number;
	stream?: MediaStream | undefined;
};
