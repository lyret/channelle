import type * as MediaSoup from "mediasoup";
import type { MediaTag, CustomAppData, TransportDirection } from "./lib/mediaSoup";

//Export types needed on the client side

export type { AppRouter } from "./_router";
export type { MediaTag, TransportDirection, CustomAppData } from "./lib/mediaSoup";
export type Transport = MediaSoup.types.WebRtcTransport<{ peerId: string; clientDirection: TransportDirection }>;
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;
export type Producer = MediaSoup.types.Producer<CustomAppData>;

/** Information about a connected tcrp peer kept in the room state server side */
export type Peer = {
	lastSeenTs: number;
	joinTs: number;
	media: Partial<Record<MediaTag, any>>;
	consumerLayers: any;
	stats: any;
};
