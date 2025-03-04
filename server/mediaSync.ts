 

import { ws } from './lib/api';


import {
	audioProducers,
	videoProducers
} from './stores/media';
import { stageLayout } from './stores/stage';

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
