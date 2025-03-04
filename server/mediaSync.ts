import type * as MediaSoup from 'mediasoup';
import * as IO from 'socket.io';
import {
	client,
	DataTypes,
	Repository,
	RepositoryOperations,
	RepositoryOperationsThatIntroducesChanges,
} from '../database';
import {
	MediaRequests,
	SubscriptionMessage,
	createSubscriptionPath,
} from '../shared/subscriptions';

import { createRTCResponseHandler, createRTCTransport } from './lib/rtc';
import { mediaSoupRouter, ws } from './lib/api';

import {
	userOnlineStatus,
	userCameraBans,
	userMicrophoneBans,
} from './stores/users';

import {
	mediaProducerTransports,
	mediaReceiverTransports,
	videoProducers,
	audioProducers,
} from './stores/media';
import { stageLayout } from './stores/stage';
import {
	handleRTCTransportConnectionRequests,
	handleRTCTransportCreationRequests,
	handleSendTransportProducingRequests,
} from './lib/requestHandlers/transportRequestHandlers';
import { handleServerRTPCapabilitiesRequests as handleRTPCapabilitiesRequests } from './lib/requestHandlers/capabilitiesRequestsHandlers';

// FIXME: working on this
export function keepProducersAndConsumersUpdated() {
	videoProducers.subscribe((data) => {
		ws().emit('video_producers_update', data);
		ws().emit('producers_update');
	});
	audioProducers.subscribe((data) => {
		const res = Object.entries(data).map(([socketId, producer]) => ({
			socketId,
			id: producer.id,
			paused: producer.paused,
			kind: producer.kind,
			type: producer.type,
		}));
		ws().emit('audio_producers_update', res);
		ws().emit('producers_update');
	});
	stageLayout.subscribe((data) => {
		ws().emit('layout_update', data);
	});
}
