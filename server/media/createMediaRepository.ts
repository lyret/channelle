import type * as SocketIO from 'socket.io';
import { createMediaSoupWorker } from './_mediaSoupWorker';
import { createMediaRouter } from './_mediaRouter';
import { MediaRepository } from './_mediaRepository';

/** Creates and returns a media repository */
export async function createMediaRepostiory(io: SocketIO.Server) {
	// Create the mediasoup worker
	const worker = await createMediaSoupWorker();

	// Create the media router
	const mediaRouter = await createMediaRouter(worker);

	// Set IO
	MediaRepository.setIO(io);

	// Create and return a repository
	return new MediaRepository(mediaRouter);
}
