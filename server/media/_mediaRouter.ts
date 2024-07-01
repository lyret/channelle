import * as MediaSoup from 'mediasoup';
import { Config } from '../../shared/config';

/** Creates a router that communicates with the media soup worker process */
export async function createMediaRouter(worker: MediaSoup.types.Worker) {
  const mediaRouter = await worker.createRouter({
    mediaCodecs: Config.mediasoup.router
      .mediaCodecs as MediaSoup.types.RtpCodecCapability[],
  });

  // Return the router
  return mediaRouter;
}
