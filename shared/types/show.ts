import type { ShowAttributes } from "../../server/models";
import type { Scene, SceneSetting } from "../../server/_types";

/** Show data for creation (without auto-generated fields) */
export interface CreateShowData {
	name: string;
	description?: string;
	nomenclature?: string;
	showPassword?: string;
	curtainsOverride?: SceneSetting;
	chatEnabledOverride?: SceneSetting;
	effectsEnabledOverride?: SceneSetting;
	visitorAudioEnabledOverride?: SceneSetting;
	visitorVideoEnabledOverride?: SceneSetting;
	currentScene?: Scene | null;
}

/** Show data for updates (all fields optional except id) */
export interface UpdateShowData {
	id: number;
	name?: string;
	description?: string;
	nomenclature?: string;
	showPassword?: string;
	curtainsOverride?: SceneSetting;
	chatEnabledOverride?: SceneSetting;
	effectsEnabledOverride?: SceneSetting;
	visitorAudioEnabledOverride?: SceneSetting;
	visitorVideoEnabledOverride?: SceneSetting;
	currentScene?: Scene | null;
}

/** Public show information (without sensitive data like password) */
export interface PublicShowData {
	id: number;
	name: string;
	description: string;
	nomenclature: string;
	isPasswordProtected: boolean;
	curtainsOverride: SceneSetting;
	chatEnabledOverride: SceneSetting;
	effectsEnabledOverride: SceneSetting;
	visitorAudioEnabledOverride: SceneSetting;
	visitorVideoEnabledOverride: SceneSetting;
	currentScene: Scene | null;
	createdAt: Date;
	updatedAt: Date;
}

/** Public show data as received from tRPC (dates are serialized as strings) */
export interface PublicShowDataResponse {
	id: number;
	name: string;
	description: string;
	nomenclature: string;
	isPasswordProtected: boolean;
	curtainsOverride: SceneSetting;
	chatEnabledOverride: SceneSetting;
	effectsEnabledOverride: SceneSetting;
	visitorAudioEnabledOverride: SceneSetting;
	visitorVideoEnabledOverride: SceneSetting;
	currentScene: Scene | null;
	createdAt: string;
	updatedAt: string;
}

/** Show list item for displaying in UI */
export interface ShowListItem {
	id: number;
	name: string;
	description: string;
	isPasswordProtected: boolean;
	isOnline: boolean;
	participantCount: number;
	url: string;
}

/** Show authentication request */
export interface ShowAuthRequest {
	showId: number;
	password: string;
}

/** Show authentication response */
export interface ShowAuthResponse {
	success: boolean;
	message?: string;
	showData?: PublicShowData;
}

/** Show authentication response as received from tRPC */
export interface ShowAuthResponseClient {
	success: boolean;
	message?: string;
	showData?: PublicShowDataResponse;
}

/** Re-export ShowAttributes from models for convenience */
export type { ShowAttributes };

/** Re-export Scene and SceneSetting types from server types for convenience */
export type { Scene, SceneSetting };
