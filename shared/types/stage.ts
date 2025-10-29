/** Shared Stage types for client-server communication */

/** Base stage information */
export interface StageData {
	id: number;
	name: string;
	description: string;
	stagePassword: string;
	createdAt: Date;
	updatedAt: Date;
}

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
