import type { CustomAppData } from "../../server/room";
export type { RoomRouter } from "../../server/room";

export type { MediaTag, CustomAppData, TransportDirection, Peer } from "../../server/room";
export type Producer = MediaSoup.types.Producer<CustomAppData>;
export type Consumer = MediaSoup.types.Consumer<CustomAppData>;
export type Transport = MediaSoup.types.Transport<CustomAppData>;
