import { showConfigClient } from "../_trpcClient";
import type { PublicShowDataResponse, Scene, SceneSetting } from "../../../shared/types/show";

/**
 * Get show configuration by ID
 */
export async function getShowConfig(showId: number): Promise<PublicShowDataResponse | null> {
	try {
		const config = await showConfigClient.getConfig.query({ showId });
		return config;
	} catch (error) {
		console.error("Failed to get show config:", error);
		return null;
	}
}

/**
 * Update show password
 */
export async function updateShowPassword(showId: number, password?: string): Promise<boolean> {
	try {
		const result = await showConfigClient.updatePassword.mutate({ showId, password });
		return result.success;
	} catch (error) {
		console.error("Failed to update show password:", error);
		return false;
	}
}

/**
 * Update scene override setting
 */
export async function updateSceneOverride(
	showId: number,
	setting: "curtains" | "chatEnabled" | "effectsEnabled" | "visitorAudioEnabled" | "visitorVideoEnabled",
	value: SceneSetting,
): Promise<boolean> {
	try {
		const result = await showConfigClient.updateSceneOverride.mutate({
			showId,
			setting,
			value,
		});
		return result.success;
	} catch (error) {
		console.error("Failed to update scene override:", error);
		return false;
	}
}

/**
 * Update current active scene
 */
export async function updateCurrentScene(showId: number, scene: Scene | null): Promise<boolean> {
	try {
		const result = await showConfigClient.updateCurrentScene.mutate({ showId, scene });
		return result.success;
	} catch (error) {
		console.error("Failed to update current scene:", error);
		return false;
	}
}

/**
 * Update multiple configuration settings at once
 */
export async function updateShowConfig(
	showId: number,
	config: {
		showPassword?: string;
		curtainsOverride?: SceneSetting;
		chatEnabledOverride?: SceneSetting;
		effectsEnabledOverride?: SceneSetting;
		visitorAudioEnabledOverride?: SceneSetting;
		visitorVideoEnabledOverride?: SceneSetting;
		currentScene?: Scene | null;
	},
): Promise<boolean> {
	try {
		const result = await showConfigClient.updateConfig.mutate({ showId, config });
		return result.success;
	} catch (error) {
		console.error("Failed to update show config:", error);
		return false;
	}
}

/**
 * Update show metadata (name, description, and nomenclature)
 */
export async function updateShowMetadata(
	showId: number,
	metadata: {
		name?: string;
		description?: string;
		nomenclature?: string;
	},
): Promise<boolean> {
	try {
		const result = await showConfigClient.updateMetadata.mutate({ showId, ...metadata });
		return result.success;
	} catch (error) {
		console.error("Failed to update show metadata:", error);
		return false;
	}
}

/**
 * Helper functions for specific scene override updates
 */
export const SceneOverrides = {
	setCurtains: (showId: number, value: SceneSetting) => updateSceneOverride(showId, "curtains", value),
	setChatEnabled: (showId: number, value: SceneSetting) => updateSceneOverride(showId, "chatEnabled", value),
	setEffectsEnabled: (showId: number, value: SceneSetting) => updateSceneOverride(showId, "effectsEnabled", value),
	setVisitorAudio: (showId: number, value: SceneSetting) => updateSceneOverride(showId, "visitorAudioEnabled", value),
	setVisitorVideo: (showId: number, value: SceneSetting) => updateSceneOverride(showId, "visitorVideoEnabled", value),
};
