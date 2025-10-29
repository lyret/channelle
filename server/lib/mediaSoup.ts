import * as MediaSoup from "mediasoup";

/** Tag for identifying the type of media transmitted in a MediaSoup transport */
export type MediaTag = "cam-video" | "mic-audio";

/** For identifying the direction of media transmission in a MediaSoup transport */
export type TransportDirection = "send" | "recv";

/** Customized MediaSoup App Data for the the entire application */
export interface CustomAppData extends MediaSoup.types.AppData {
	/** Identifies the peer that is sending the media */
	peerId: string;
	/** Identifies the type of media transmitted */
	mediaTag: MediaTag;
}

let _router: MediaSoup.types.Router<CustomAppData> | undefined;
let _worker: MediaSoup.types.Worker<CustomAppData> | undefined;

/** Returns the global MediaSoup worker and media router pair  */
export async function mediaSoup() {
	// Create the MediaSoup worker instance
	const worker = await mediaSoupWorker();

	// Create the MediaSoup media router
	const router = await mediaSoupRouter();

	// Debug output
	console.log("[MS Server] media soup version", MediaSoup.version);

	// Return the pair
	return { worker, router };
}

/** Connects to the MediaSoup worker and return the global MediaSoup worker connection */
export async function mediaSoupWorker() {
	// Return already initialized singelton instance
	if (_worker) {
		return _worker;
	}

	// Create the worker
	_worker = await MediaSoup.createWorker<CustomAppData>({
		logLevel: CONFIG.mediasoup.worker.logLevel as MediaSoup.types.WorkerLogLevel,
		logTags: CONFIG.mediasoup.worker.logTags as MediaSoup.types.WorkerLogTag[],
		rtcMinPort: CONFIG.mediasoup.worker.rtcMinPort,
		rtcMaxPort: CONFIG.mediasoup.worker.rtcMaxPort,
	});

	// Handle worker process interruptions
	_worker.on("died", () => {
		console.error(`[MS Server] the mediasoup worker died, exiting in 2 seconds... [pid:${_worker.pid}]`);
		setTimeout(() => process.exit(1), 2000);
	});

	// Return the worker
	return _worker;
}

/** Returns the global MediaSoup worker that communicates with the media soup worker process */
export async function mediaSoupRouter() {
	// Return already initialized singelton instance
	if (_router) {
		return _router;
	}

	// Get the worker
	const worker = await mediaSoupWorker();

	// Create and return the router
	const mediaCodecs = CONFIG.mediasoup.router.mediaCodecs as MediaSoup.types.RtpCodecCapability[];
	_router = await worker.createRouter({
		mediaCodecs,
	});

	return _router;
}
