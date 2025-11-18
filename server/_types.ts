import type * as MediaSoup from "mediasoup";
import type { CustomAppData, TransportDirection } from "./lib/mediaSoup";
import type { ShowAttributes } from "./models";

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
	gratitudeEffectsEnabled: boolean;
	criticalEffectsEnabled: boolean;
	visitorAudioEnabled: boolean;
	visitorVideoEnabled: boolean;
};

/** The Shown attribues needed when listed on the theater page */
export type ShowListEntry = Pick<ShowAttributes, "id" | "name" | "description" | "nomenclature" | "online" | "url" | "lastOnlineAt">;

/**
 * The backstage configuration type is the fields of a show database object that effects
 * the functionality and behavior of the stage and is changable from the backstage and preparations ui
 */
export type BackstageConfiguration = Omit<
	ShowAttributes,
	"id" | "online" | "createdAt" | "updatedAt" | "lastOnlineAt" | "nrOfTimesShown" | "nrOfTimes" | "nrOfTimesRehersed" | "url"
> & {
	/** Identification for the selected show in the database */
	showId: ShowAttributes["id"] | null;
	/** Determines if the backstage configuration is editable */
	isEditable: boolean;
};

export type EffectData = { type: "flowers" | "applause" | "tomato"; number: number };

//Export types needed on the client side

export type { AppRouter } from "./_router";
export type { MediaTag, TransportDirection, CustomAppData } from "./lib/mediaSoup";
export type { Peer, Session } from "./lib/trpc";
export type { MessageAttributes, ShowAttributes } from "./models";
export type {
	CanLaunchResult,
	LaunchResult,
	InstanceInfo,
	InstanceStatus,
	AdapterStatus,
	LauncherSyncData,
	InstanceInfoSerialized,
	LauncherSyncDataSerialized,
} from "./launchers/types";
export type Transport = MediaSoup.types.WebRtcTransport<{ peerId: string; clientDirection: TransportDirection }>;
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;
export type Producer = MediaSoup.types.Producer<CustomAppData>;
