import type * as MediaSoup from "mediasoup";
import type { CustomAppData, TransportDirection } from "./lib/mediaSoup";

// TODO: Create a types folder maybe ?

/** A forcable setting for overriding how the stage behaves, possibly overriding the current scene */
export enum SceneSetting {
	/** Use the value from the current scene */
	// eslint-disable-next-line no-unused-vars
	AUTOMATIC = 0,
	/** Force the setting to be enabled, ignoring the setting of the current scene */
	// eslint-disable-next-line no-unused-vars
	FORCED_ON = 1,
	/** Forces the setting to be disabled, ignoring the setting of the current scene */
	// eslint-disable-next-line no-unused-vars
	FORCED_OFF = 2,
}

/** Stage Layout Value */
export type StageLayout = Array<Array<{ type: "actor"; peerId: string } | { type: "chat" } | { type: "empty" }>>;

/** A Scene contains a predefined layout and settings for how the stage behaves */
export type Scene = {
	name: string;
	layout: StageLayout;
	curtains: boolean;
	chatEnabled: boolean;
	effectsEnabled: boolean;
	visitorAudioEnabled: boolean;
	visitorVideoEnabled: boolean;
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
