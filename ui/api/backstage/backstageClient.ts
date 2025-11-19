import type { BackstageConfiguration, EditableShowAttributes } from "../../types/serverSideTypes";
import { writable, derived } from "svelte/store";
import { backstageClient } from "../_trpcClient";

/** In-memory local show id of any loaded configuration */
let _localShowId: number = 0;

/** Contains the currently loaded/displayed backstage configuration from the server */
const _localConfigStore = writable<BackstageConfiguration>({
	showId: null,
	isEditable: false,
	name: "",
	description: "",
	nomenclature: "föreställningen",
	password: "",
	curtainsOverride: 1,
	chatEnabledOverride: 2,
	gratitudeEffectsEnabledOverride: 2,
	criticalEffectsEnabledOverride: 2,
	visitorAudioEnabledOverride: 2,
	visitorVideoEnabledOverride: 2,
	selectedScene: null,
});

// PUBLIC DERIVED STORES OF CONFIGURATION DATA

/** Current show password from configuration */
export const showPasswordStore = derived(_localConfigStore, ($config) => $config.password);

/** Current overriden scene settings from configuration */
export const showSceneSettingsStore = derived(_localConfigStore, ($config) => ({
	curtains: $config.curtainsOverride == 1 || ($config.curtainsOverride == 0 && $config.selectedScene?.curtains) || true,
	chatEnabled: $config.chatEnabledOverride == 1 || ($config.chatEnabledOverride == 0 && $config.selectedScene?.chatEnabled) || false,
	gratitudeEffects:
		$config.gratitudeEffectsEnabledOverride == 1 ||
		($config.gratitudeEffectsEnabledOverride == 0 && $config.selectedScene?.gratitudeEffectsEnabled) ||
		false,
	criticalEffects:
		$config.criticalEffectsEnabledOverride == 1 || ($config.criticalEffectsEnabledOverride == 0 && $config.selectedScene?.criticalEffectsEnabled) || false,
	visitorAudioEnabled:
		$config.visitorAudioEnabledOverride == 1 || ($config.visitorAudioEnabledOverride == 0 && $config.selectedScene?.visitorAudioEnabled) || false,
	visitorVideoEnabled:
		$config.visitorVideoEnabledOverride == 1 || ($config.visitorVideoEnabledOverride == 0 && $config.selectedScene?.visitorVideoEnabled) || false,
}));

/** Currently selected scene from configuration */
export const showSelectedSceneStore = derived(_localConfigStore, ($config) => $config.selectedScene);

/** Current show metadata from configuration */
export const showMetadataStore = derived(_localConfigStore, ($config) => ({
	name: $config.name || "namnlös",
	description: $config.description,
	nomenclature: $config.nomenclature || "föreställningen",
}));

/** Loading state for current show configuration operations */
export const configurationIsLoading = writable<boolean>(false);

/** Error messages from current show configuration operations */
export const configurationHasError = writable<string | null>(null);

/** Updates the given configuration properties */
export async function updateConfigurationSettings(update: Partial<EditableShowAttributes>) {
	try {
		await backstageClient.updateProperties.mutate({ showId: _localShowId, update: update });
		return { success: true };
	} catch (error) {
		console.error("Failed to update configuration properties:", { error, showId: _localShowId, update });
		const errorMessage = error instanceof Error ? error.message : "Failed to update configuration properties";
		configurationHasError.set(errorMessage);
		return { success: false, error: errorMessage };
	}
}

/** Reset all overrididen settings to automatic */
export async function automateOverridenSettings() {
	try {
		await backstageClient.automateOverridenSettings.mutate({ showId: _localShowId });
		return { success: true };
	} catch (error) {
		console.error("Failed to reset settings to automatic:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to reset settings";
		configurationHasError.set(errorMessage);
		return { success: false, error: errorMessage };
	}
}

/**
 * Syncs the local backstage configuration store
 * with a show in the database and keeps them in sync using subsription
 */
export async function subscribeToBackstageConfigurationChanges(): Promise<void> {
	try {
		configurationIsLoading.set(true);
		configurationHasError.set(null);
		let showId = 0;

		// In stage mode, show id is constant and does not need to be determined on the client,
		// but in theater mode, we need to get show ID from URL parameters
		if (CONFIG.runtime.theater) {
			const urlParams = new URLSearchParams(window.location.search);
			const showIdParam = urlParams.get("show");
			if (!showIdParam) {
				throw new Error("Show id not selected in the URL");
			}
			if (isNaN(parseInt(showIdParam))) {
				throw new Error("Invalid show id selected in URL");
			}
			showId = parseInt(showIdParam);
		}

		// Start subscription to backstage configuration changes
		backstageClient.configuration.subscribe(
			{ showId: showId },
			{
				onData: (data) => {
					if (CONFIG.runtime.debug) {
						console.error("Configuration subscription data:", data);
					}
					_localConfigStore.set(data.config);
					_localShowId = data.config.showId || 0;
					if (data.type == "initial") {
						configurationIsLoading.set(false);
					}
				},
				onError: (error) => {
					console.error("Configuration subscription error:", error);
					configurationHasError.set(error instanceof Error ? error.message : "Unknown initialization error");
				},
				onComplete: () => {
					console.log("Configuration subscription completed");
				},
			},
		);
	} catch (error) {
		console.error("Failed to start configuration synchronization:", error);
		configurationHasError.set(error instanceof Error ? error.message : "Unknown initialization error");
	} finally {
		configurationIsLoading.set(false);
	}
}
