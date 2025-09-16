import type * as MediaSoup from "mediasoup";
import type { MediaTag, CustomAppData } from "../../lib/mediaSoup";

export type { RoomRouter } from "./roomRouter";
export type { MediaTag, TransportDirection, CustomAppData } from "../../lib/mediaSoup";

export type Transport = MediaSoup.types.WebRtcTransport<{ peerId: string; clientDirection: string }>;
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;
export type Producer = MediaSoup.types.Producer<CustomAppData>;

/**
 * On the server we keep lists of transports, producers, and
 * consumers. whenever we create a transport, producer, or consumer,
 * we save the remote peerId in the object's `appData`. for producers
 * and consumers we also keep track of the client-side "media tag", to
 * correlate tracks.
 */
export type Room = {
	peers: Record<string, Peer>;
	activeSpeaker: {
		producerId: string | null;
		volume: number | null;
		peerId: string | null;
	};
	// internal
	transports: {
		[id: string]: Transport;
	};
	producers: {
		[id: string]: MediaSoup.types.Producer<CustomAppData>;
	};
	consumers: {
		[id: string]: MediaSoup.types.Consumer<CustomAppData>;
	};
};

/** Information about a peer kept on the server side */
export type Peer = {
	lastSeenTs: number;
	joinTs: number;
	media: Partial<Record<MediaTag, any>>;
	consumerLayers: any;
	stats: any;
};
