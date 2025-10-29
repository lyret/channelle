import type { InferAttributes } from "sequelize";
import type { Peer } from "./Peer";
import type { Message } from "./Message";
import type { Scene } from "./Scene";
import type { Stage } from "./Stage";

// Export types for models
export type PeerType = typeof Peer;
export type MessageType = typeof Message;
export type SceneType = typeof Scene;
export type StageType = typeof Stage;

// Model instance types
export type PeerInstance = InstanceType<PeerType>;
export type MessageInstance = InstanceType<MessageType>;
export type SceneInstance = InstanceType<SceneType>;
export type StageInstance = InstanceType<StageType>;

// Model attributes types
export type PeerAttributes = InferAttributes<Peer>;
export type MessageAttributes = InferAttributes<Message>;
export type SceneAttributes = InferAttributes<Scene>;
export type StageAttributes = InferAttributes<Stage>;
