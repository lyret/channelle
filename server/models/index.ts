import type { InferAttributes } from "sequelize";
import type { Peer } from "./Peer";
import type { Message } from "./Message";
import type { Scene } from "./Scene";
import type { Show } from "./Show";
import type { History } from "./History";

// Export types for models
export type PeerType = typeof Peer;
export type MessageType = typeof Message;
export type SceneType = typeof Scene;
export type ShowType = typeof Show;
export type HistoryType = typeof History;

// Model instance types
export type PeerInstance = InstanceType<PeerType>;
export type MessageInstance = InstanceType<MessageType>;
export type SceneInstance = InstanceType<SceneType>;
export type ShowInstance = InstanceType<ShowType>;
export type HistoryInstance = InstanceType<HistoryType>;

// Model attributes types
export type PeerAttributes = InferAttributes<Peer>;
export type MessageAttributes = InferAttributes<Message>;
export type SceneAttributes = InferAttributes<Scene>;
export type ShowAttributes = InferAttributes<Show>;
export type HistoryAttributes = InferAttributes<History>;
