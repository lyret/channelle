import type { BackstageConfiguration } from "./_types";
import { SceneSetting } from "./_types";
import { Show } from "./models/Show";

/**
 * Global in-memory selected backstage configuration for
 * when running the program in stage mode.
 */
let _backstageConfiguration: BackstageConfiguration = {
	showId: null,
	isEditable: true,
	name: "",
	description: "",
	nomenclature: "föreställningen",
	password: "",
	curtainsOverride: SceneSetting.FORCED_ON,
	chatEnabledOverride: SceneSetting.FORCED_OFF,
	gratitudeEffectsEnabledOverride: SceneSetting.FORCED_OFF,
	criticalEffectsEnabledOverride: SceneSetting.FORCED_OFF,
	visitorAudioEnabledOverride: SceneSetting.FORCED_OFF,
	visitorVideoEnabledOverride: SceneSetting.FORCED_OFF,
	selectedScene: null,
};

/**
 * Load show configuration from the database by the given show id
 * This function is called during server startup when --showId is provided.
 */
export async function loadBackstageConfigurationFromRuntime(): Promise<void> {
	try {
		const showId = CONFIG.backstage.showId;
		const defaultShowName = CONFIG.backstage.showDefaults?.name;
		const defaultShowPassword = CONFIG.backstage.showDefaults?.password;

		if (showId) {
			console.log(`[Backstage] Loading show configuration from database entry with id: ${showId}...`);
			const show = await Show.findByPk(showId);

			if (!show) {
				throw new Error(`Show with id ${showId} not found`);
			}
			_backstageConfiguration = toBackstageConfiguration(show);
		} else {
			if (defaultShowName) {
				console.log(`[Backstage] Loading default show name from runtime configuration: ${defaultShowName}`);
				_backstageConfiguration.name = defaultShowName || _backstageConfiguration.name;
			}

			if (defaultShowPassword) {
				console.log(`[Backstage] Loading default show password from runtime configuration: ${defaultShowPassword}`);
				_backstageConfiguration.password = defaultShowPassword || _backstageConfiguration.password;
			}
		}

		if (CONFIG.runtime.debug) {
			console.log("[Backstage] Configuration summary:");
			Object.entries(_backstageConfiguration).forEach(([key, value]) => {
				console.log(` - ${key}: ${value}`);
			});
		}
	} catch (error) {
		console.error("[Backstage] Error loading show configuration:", error);
		throw error;
	}
}

/** Utility function that turns a show into a backstage configuration object */
export function toBackstageConfiguration(show: Show): BackstageConfiguration {
	return {
		showId: show.id,
		isEditable: !show.online,
		name: show.name,
		description: show.description,
		nomenclature: show.nomenclature,
		password: show.password,
		curtainsOverride: show.curtainsOverride,
		chatEnabledOverride: show.chatEnabledOverride,
		gratitudeEffectsEnabledOverride: show.gratitudeEffectsEnabledOverride,
		criticalEffectsEnabledOverride: show.criticalEffectsEnabledOverride,
		visitorAudioEnabledOverride: show.visitorAudioEnabledOverride,
		visitorVideoEnabledOverride: show.visitorVideoEnabledOverride,
		selectedScene: show.selectedScene,
	};
}

/** Utility function that updates a given backstage id to the database */
export async function saveBackstageConfiguration(config: BackstageConfiguration) {
	if (config.showId) {
		try {
			const show = await Show.findByPk(config.showId);
			if (show) {
				await show.update({
					name: config.name,
					description: config.description,
					nomenclature: config.nomenclature,
					password: config.password,
					curtainsOverride: config.curtainsOverride,
					chatEnabledOverride: config.chatEnabledOverride,
					gratitudeEffectsEnabledOverride: config.gratitudeEffectsEnabledOverride,
					criticalEffectsEnabledOverride: config.criticalEffectsEnabledOverride,
					visitorAudioEnabledOverride: config.visitorAudioEnabledOverride,
					visitorVideoEnabledOverride: config.visitorVideoEnabledOverride,
					selectedScene: config.selectedScene,
				});
				console.log(`[Backstage] Configuration persisted to the database on show with id ${show.id}: ${show.name}`);
			}
		} catch (error) {
			console.error("[Backstage] Error persisting backstage config to database:", error);
		}
	}
}

/**
 * Gets the currently loaded backstage configuration
 */
export function getGlobalBackstageConfiguration(): BackstageConfiguration {
	return _backstageConfiguration;
}
