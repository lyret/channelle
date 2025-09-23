import type * as MediaSoup from "mediasoup";
import type { CustomAppData, TransportDirection } from "./lib/mediaSoup";

// TODO: Create a types folder maybe ?

/** Stage Layout Value */
export type StageLayout = Array<Array<{ type: "actor"; peerId: string } | { type: "chat" } | { type: "empty" }>>;

/** A Predefined layout from the scene instrument */
export type PredefinedLayout = {
	name: string;
	chatEnabled: boolean;
	layout: StageLayout;
};

export type EffectData = { type: "flowers" | "applause"; number: number };

//Export types needed on the client side

export type { AppRouter } from "./_router";
export type { MediaTag, TransportDirection, CustomAppData } from "./lib/mediaSoup";
export type { Peer, Session } from "./lib/trpc";
export type { MessageAttributes } from "./models";
export type Transport = MediaSoup.types.WebRtcTransport<{ peerId: string; clientDirection: TransportDirection }>;
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;
export type Producer = MediaSoup.types.Producer<CustomAppData>;
