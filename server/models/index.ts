import type { InferAttributes } from "sequelize";
import type { Participant } from "./Participant";
import type { Message } from "./Message";
import type { Scene } from "./Scene";

// Export types for models
export type ParticipantType = typeof Participant;
export type MessageType = typeof Message;
export type SceneType = typeof Scene;

// Model instance types
export type ParticipantInstance = InstanceType<ParticipantType>;
export type MessageInstance = InstanceType<MessageType>;
export type SceneInstance = InstanceType<SceneType>;

// Model attributes types
export type ParticipantAttributes = InferAttributes<Participant>;
export type MessageAttributes = InferAttributes<Message>;
export type SceneAttributes = InferAttributes<Scene>;
