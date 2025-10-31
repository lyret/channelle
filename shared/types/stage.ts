import type { StageAttributes } from "../../server/models";

/** Stage data for creation (without auto-generated fields) */
export interface CreateStageData {
	name: string;
	description?: string;
	stagePassword?: string;
}

/** Stage data for updates (all fields optional except id) */
export interface UpdateStageData {
	id: number;
	name?: string;
	description?: string;
	stagePassword?: string;
}

/** Public stage information (without sensitive data like password) */
export interface PublicStageData {
	id: number;
	name: string;
	description: string;
	isPasswordProtected: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** Public stage data as received from tRPC (dates are serialized as strings) */
export interface PublicStageDataResponse {
	id: number;
	name: string;
	description: string;
	isPasswordProtected: boolean;
	createdAt: string;
	updatedAt: string;
}

/** Stage list item for displaying in UI */
export interface StageListItem {
	id: number;
	name: string;
	description: string;
	isPasswordProtected: boolean;
	isOnline: boolean;
	participantCount: number;
	url: string;
}

/** Stage authentication request */
export interface StageAuthRequest {
	stageId: number;
	password: string;
}

/** Stage authentication response */
export interface StageAuthResponse {
	success: boolean;
	message?: string;
	stageData?: PublicStageData;
}

/** Stage authentication response as received from tRPC */
export interface StageAuthResponseClient {
	success: boolean;
	message?: string;
	stageData?: PublicStageDataResponse;
}

/** Re-export StageAttributes from models for convenience */
export type { StageAttributes };
