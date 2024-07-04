import * as MediaSoup from 'mediasoup';

/** Creates a router that communicates with the media soup worker process */
export async function createMediaRouter(worker: MediaSoup.types.Worker) {
	const mediaRouter = await worker.createRouter({
		mediaCodecs: CONFIG.mediasoup.router
			.mediaCodecs as MediaSoup.types.RtpCodecCapability[],
	});

	// Return the router
	return mediaRouter;
}
