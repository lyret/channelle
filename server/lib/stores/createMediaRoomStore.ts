import type * as MediaSoup from 'mediasoup';
import EventEmitter from 'node:events';
import { attempt } from '../utils/attempt';
import { mediaSoupRouter, ws } from '../api';
import { createRTCResponseHandler } from '../rtc';
import {
	userOnlineStatus,
	userCameraBans,
	userMicrophoneBans,
} from '../../stores/users';
import { client, DataTypes } from '../../../database';

type Entry = {
	onStage: boolean;
	audioAllowed: boolean;
	videoAllowed: boolean;
	participant: DataTypes['participant'];
};

/** TODO: Creates a new observable store for a map of values */
export function createMediaRoomStore(identifier: string): MediaRoomStore {
	const _identifier = identifier;
	const _io = ws().of(`/${identifier}`);
	const _emitter: EventEmitter = new EventEmitter();
	let _value: MediaRoomValue = undefined;

	const _getParticipants = async (): Promise<
		Record<number, DataTypes['participant']>
	> => {
		return (
			await client.participant.findMany({
				where: { actor: true },
			})
		).reduce((record, particpant) => {
			record[particpant.id] = particpant;
			return record;
		}, {});
	};

	const participantOnline(id: number) {
		
	}

	const _set = async (value: MediaRoomValue): Promise<void> => {
		const participants = await _getParticipants();

		_value = value;
		_emitter.emit('*', _value);
		_io.emit('*', _value);
	};

	// A map between connected sockets and participant ids for that socket
	// @type: { [SocketId] : ParticipationId }
	const _connectedParticipants = new Map<string, number>();

	const subscribe = () => {
		const onUserOnlineStatus = (
			userOnlineStatus: Record<number, boolean>
		) => {};
		userOnlineStatus.subscribe(onUserOnlineStatus);
		const onUserCameraBans = (userCameraBans: Record<number, boolean>) => {};
		userCameraBans.subscribe(onUserCameraBans);
		const onUserMicrophoneBans = (
			userMicrophoneBans: Record<number, boolean>
		) => {};
		userMicrophoneBans.subscribe(onUserMicrophoneBans);
	};
}

/** TODO: Observable Map Store Interface */
export type MediaRoomStore = any & {
	/** Returns the key for this observable map, unique for server<->client communication */
	key: string;
	/** Sets a key in the map to the given value */
	set: (key: K, value: V) => void;
	/** Removes a single value from the map */
	delete: (key: K) => void;
	/** Removes all values of the map */
	clear: () => void;
	/** Returns true if a key exists in the map */
	has: (key: K) => boolean;
	/** Returns a single value directly from the map */
	get: (key: K) => V | undefined;
	/** Returns the underlying map object directly */
	map: () => Map<K, V>;
	/** Returns an iterable iterator for each key value pair in the map */
	entries: () => IterableIterator<[K, V]>;
	/** Subscribe to updates to the map, retuns the unsubscibe function */
	subscribe: (handler: (data: Record<K, V>) => any) => () => void;
};

/** TODO: Events emitted within the observable map store */
export type OMEvents<K extends string | number, V> = {
	'*': Record<K, V>;
};

// TODO:
type MediaRoomValue = any;
// TODO:
type Res = {
	consumers: Array<{
		socketId: string;
		producerId: string;
		id: string;
		kind: MediaSoup.types.MediaKind;
		rtpParameters: MediaSoup.types.RtpParameters;
		participantId: number;
	}>;
};
