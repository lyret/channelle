import { Participant } from "./Participant";
import { Message } from "./Message";
import { Scene } from "./Scene";

// Export types for models
export type ParticipantType = typeof Participant;
export type MessageType = typeof Message;
export type SceneType = typeof Scene;

// Model instance types
export type ParticipantInstance = InstanceType<ParticipantType>;
export type MessageInstance = InstanceType<MessageType>;
export type SceneInstance = InstanceType<SceneType>;
