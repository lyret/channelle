import * as MediaSoup from 'mediasoup';
import { Config } from '../../shared/config';

/** Creates and returns a MediaSoup worker processes */
export async function createMediaSoupWorker() {
	const worker = await MediaSoup.createWorker({
		logLevel: Config.mediasoup.worker
			.logLevel as MediaSoup.types.WorkerLogLevel,
		logTags: Config.mediasoup.worker.logTags as MediaSoup.types.WorkerLogTag[],
		rtcMinPort: Config.mediasoup.worker.rtcMinPort,
		rtcMaxPort: Config.mediasoup.worker.rtcMaxPort,
	});

	// Handle worker process interruptions
	worker.on('died', () => {
		console.error(
			`[MS Server] the mediasoup worker died, exiting in 2 seconds... [pid:${worker.pid}]`
		);
		setTimeout(() => process.exit(1), 2000);
	});

	// Return the worker
	return worker;
}
