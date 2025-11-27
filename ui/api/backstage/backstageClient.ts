import type { BackstageConfiguration, EditableShowAttributes, ClientPeerAttributes } from "../../types/serverSideTypes";
import { writable, derived } from "svelte/store";
import { backstageClient, peersClient } from "../_trpcClient";

/** In-memory local show id of any loaded configuration */
let _localShowId: number = 0;

/** Contains the currently loaded/displayed backstage configuration from the server */
const _localConfigStore = writable<BackstageConfiguration>({
	showId: null,
	isEditable: false,
	name: "",
	description: "",
	nomenclature: "föreställningen",
	script: null,
	password: "",
	curtainsOverride: 1,
	chatEnabledOverride: 2,
	gratitudeEffectsEnabledOverride: 2,
	criticalEffectsEnabledOverride: 2,
	visitorAudioEnabledOverride: 2,
	visitorVideoEnabledOverride: 2,
	selectedScene: null,
});

/** Contains a registry of all peers belonging to the loaded show configuration */
const _localPeers = writable<Record<string, ClientPeerAttributes>>({});

// PUBLIC DERIVED STORES OF CONFIGURATION DATA

/** Current show password from configuration */
export const showPasswordStore = derived(_localConfigStore, ($config) => $config.password);

/** Current actual scene settings from configuration after taking selected scene and overrides into account */
export const showSceneSettingsStore = derived(_localConfigStore, ($config) => {
	let curtains = true;
	if ($config.curtainsOverride == 1) {
		curtains = true;
	} else if ($config.curtainsOverride == 2) {
		curtains = false;
	} else if ($config.curtainsOverride == 0) {
		if (!$config.selectedScene) {
			curtains = true;
		} else {
			curtains = $config.selectedScene.curtains;
		}
	}

	return {
		curtains: curtains,
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
	}
});

/** Current actually override value for settings from the configuration */
export const showSceneOverridesStore = derived(_localConfigStore, ($config) => ({
	curtainsOverride: $config.curtainsOverride,
	chatEnabledOverride: $config.chatEnabledOverride,
	visitorAudioEnabledOverride: $config.visitorAudioEnabledOverride,
	visitorVideoEnabledOverride: $config.visitorVideoEnabledOverride,
	gratitudeEffectsEnabledOverride: $config.gratitudeEffectsEnabledOverride,
	criticalEffectsEnabledOverride: $config.criticalEffectsEnabledOverride,
}));

/** Currently selected scene from configuration */
export const showSelectedSceneStore = derived(_localConfigStore, ($config) => $config.selectedScene);

/** Current show metadata from configuration */
export const showMetadataStore = derived(_localConfigStore, ($config) => ({
	name: $config.name || "namnlös",
	description: $config.description,
	nomenclature: $config.nomenclature || "föreställningen",
}));

/** Current show script from configuration */
export const showScriptStore = derived(_localConfigStore, ($config) => ({
	script: $config.script || null,
}));

/** Current show peers from the database */
export const showPeersStore = derived(
	_localPeers,
	($localPeers) => {
		return $localPeers;
	},
	{},
);

/** Loading state for backstage configuration sync operations */
export const configurationIsLoading = writable<boolean>(false);

/** Error messages from the backstage configuration sync operations */
export const configurationError = writable<string | null>(null);

/** Updates the given configuration properties */
export async function updateConfigurationSettings(update: Partial<EditableShowAttributes>) {
	try {
		await backstageClient.updateProperties.mutate({ showId: _localShowId, update: update });
		return { success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Failed to update configuration properties";
		return { success: false, error: errorMessage };
	}
}

/** Reset all overrididen settings to automatic */
export async function automateOverridenSettings() {
	try {
		await backstageClient.automateOverridenSettings.mutate({ showId: _localShowId });
		return { success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Failed to reset settings";
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
		configurationError.set(null);
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
						console.log("Configuration subscription data:", { data });
					}
					_localConfigStore.set(data.config);
					_localShowId = data.config.showId || 0;
					if (data.type == "initial") {
						configurationIsLoading.set(false);
					}
				},
				onError: (error) => {
					console.error("Configuration subscription error:", error instanceof Error ? error.message : "Unknown initialization error");
					configurationError.set(error instanceof Error ? error.message : "Unknown initialization error");
				},
				onComplete: () => {
					console.log("Configuration subscription completed");
				},
			},
		);

		// Start subscription to all peers belonging to the loaded show configuration
		peersClient.peers.subscribe(
			{ showId: showId },
			{
				onData: (data) => {
					if (CONFIG.runtime.debug) {
						console.log("Peers subscription data:", { data });
					}
					if (data.event == "initial") {
						_localPeers.set(data.peers);
					} else {
						_localPeers.update((record) => {
							record[data.peer.id] = data.peer;
							return record;
						});
					}
				},
				onError: (error) => {
					console.error("Peers subscription error:", error instanceof Error ? error.message : "Unknown peer synchronization error");
				},
				onComplete: () => {
					console.log("Peers subscription completed");
				},
			},
		);
	} catch (error) {
		console.error("Configuration subscription error:", error instanceof Error ? error.message : "Unknown initialization error");
		configurationError.set(error instanceof Error ? error.message : "Unknown initialization error");
	} finally {
		configurationIsLoading.set(false);
	}
}
