import * as MediaSoup from "mediasoup";

let _router: MediaSoup.types.Router<ExtendedAppData> | undefined;
let _worker: MediaSoup.types.Worker<ExtendedAppData> | undefined;

/** MediaSoup App Data Tags for identifying the type of media transmitted */
type MediaTag = "cam-video" | "cam-audio";

/** MediaSoup App Data */
export interface ExtendedAppData extends MediaSoup.types.AppData {
	peerId: string;
	mediaTag: MediaTag | undefined;
	clientDirection?: any;
}

// interface ConsumerAppData extends MediaSoup.types.AppData {
// 	peerId: string;
// 	mediaTag: string;
// }

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
	_worker = await MediaSoup.createWorker<ExtendedAppData>({
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
