import type * as MediaSoup from "mediasoup";
import type { CustomAppData, TransportDirection } from "./lib/mediaSoup";

//Export types needed on the client side

export type { AppRouter } from "./_router";
export type { MediaTag, TransportDirection, CustomAppData } from "./lib/mediaSoup";
export type { Peer } from "./lib/trpc";
export type Transport = MediaSoup.types.WebRtcTransport<{ peerId: string; clientDirection: TransportDirection }>;
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;
export type Producer = MediaSoup.types.Producer<CustomAppData>;
