import type { RouterOutputTypes } from "../_trpcClient";
import type { Scene, SceneSetting } from "../../types/serverSideTypes";
import { writable, derived } from "svelte/store";
import { backstageClient } from "../_trpcClient";

/**
 * Complete configuration state store
 * Contains all current runtime configuration including show metadata
 */
const _configStore = writable<RouterOutputTypes["backstage"]["getConfig"]>({
	password: undefined,
	sceneSettings: {
		curtains: 0, // SceneSetting.AUTOMATIC
		chatEnabled: 0,
		gratitudeEffectsEnabled: 0,
		criticalEffectsEnabled: 0,
		visitorAudioEnabled: 0,
		visitorVideoEnabled: 0,
	},
	currentScene: undefined,
	selectedShowId: undefined,
	showMetadata: null,
});

// DERIVED STORES (Convenient views of configuration data)

/** Current password from configuration */
export const showPasswordStore = derived(_configStore, ($config) => $config.password);

/** Current scene settings from configuration */
export const showSceneOverridesStores = derived(_configStore, ($config) => $config.sceneSettings);

/** Current active scene from configuration */
export const showSceneSelectionStores = derived(_configStore, ($config) => $config.currentScene);

/** Current show metadata from configuration */
export const showMetadataStore = derived(_configStore, ($config) => $config.showMetadata);

/** Loading state for current show configuration operations */
export const currentShowIsLoading = writable<boolean>(false);

/** Error messages from current show configuration operations */
export const currentShowError = writable<string | null>(null);

// ============================================================================
// UNIFIED CONFIGURATION API
// ============================================================================

/**
 * Get current stage configuration
 * Returns complete configuration including runtime state and show metadata
 */
async function _updateConfig(): Promise<void> {
	try {
		currentShowError.set(null);
		const config = await backstageClient.getConfig.query();
		_configStore.set(config);
	} catch (error) {
		console.error("Failed to get configuration:", error);
		currentShowError.set(error instanceof Error ? error.message : "Failed to get configuration");
	}
}

/**
 * Select a show for the current session
 * All subsequent configuration operations will work against this selected show
 *
 * @param showId - The ID of the show to select
 */
async function _setSelectedShow(showId?: number): Promise<boolean> {
	try {
		currentShowIsLoading.set(true);
		currentShowError.set(null);

		const result = await backstageClient.selectShow.mutate({ showId });

		// Refresh configuration after selection
		await _updateConfig();

		return result.success;
	} catch (error) {
		console.error("Failed to select show:", error);
		currentShowError.set(error instanceof Error ? error.message : "Failed to select show");
		return false;
	} finally {
		currentShowIsLoading.set(false);
	}
}

/**
 * Set password for current runtime configuration
 * Optionally persist to selected show if available
 *
 * @param password - New password or undefined to remove
 * @param persistToShow - Whether to persist to the selected show
 * @returns Promise<{success: boolean, error?: string}> - result with success status and optional error
 */
export async function setPassword(password?: string, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await backstageClient.setPassword.mutate({ password, persistToShow });

		// Refresh configuration after change
		await _updateConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to set password:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to set password";
		return { success: false, error: errorMessage };
	}
}

/**
 * Set scene setting override
 * Optionally persist to selected show if available
 *
 * @param key - Setting key to modify
 * @param value - Setting value (0=Auto, 1=Force Enable, 2=Force Disable)
 * @param persistToShow - Whether to persist to the selected show
 * @returns Promise<{success: boolean, error?: string}> - result with success status and optional error
 */
export async function setSetting(
	key: "curtains" | "chatEnabled" | "gratitudeEffectsEnabled" | "criticalEffectsEnabled" | "visitorAudioEnabled" | "visitorVideoEnabled",
	value: SceneSetting,
	persistToShow: boolean = false,
): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await backstageClient.setSetting.mutate({ key, value, persistToShow });

		// Refresh configuration after change
		await _updateConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to set setting:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to set setting";
		return { success: false, error: errorMessage };
	}
}

/**
 * Set current scene configuration
 * Optionally persist to selected show if available
 *
 * @param scene - Scene configuration or null to clear
 * @param persistToShow - Whether to persist to the selected show
 * @returns Promise<{success: boolean, error?: string}> - result with success status and optional error
 */
export async function setScene(scene: Scene | null, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await backstageClient.setScene.mutate({ scene, persistToShow });

		// Refresh configuration after change
		await _updateConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to set scene:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to set scene";
		return { success: false, error: errorMessage };
	}
}

/**
 * Reset all settings to automatic
 * Optionally persist to selected show if available
 *
 * @param persistToShow - Whether to persist to the selected show
 * @returns Promise<{success: boolean, error?: string}> - result with success status and optional error
 */
export async function resetSettings(persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await backstageClient.resetSettings.mutate({ persistToShow });

		// Refresh configuration after change
		await _updateConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to reset settings:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to reset settings";

		return { success: false, error: errorMessage };
	}
}

/** Update show metadata */
export async function updateShowMetadata(
	showId?: number,
	metadata: { name?: string; description?: string; nomenclature?: string } = {},
): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await backstageClient.updateShowMetadata.mutate({ showId, ...metadata });

		// Refresh configuration after change
		await _updateConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to update show metadata:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to update show metadata";
		return { success: false, error: errorMessage };
	}
}

/**
 * Enable global config synchronization
 *
 * Sets up periodic config refresh to detect external changes from other users/tabs.
 * This ensures all config-dependent components stay in sync with server state.
 */
export function enableConfigSynchronization(): void {
	setInterval(async () => {
		try {
			await _updateConfig();
		} catch (error) {
			console.error("Failed to sync config:", error);
		}
	}, 2000); // Check every 2 seconds
}

/**
 * Initialize the configuration API system
 * Sets up show selection based on application mode and loads initial configuration
 */
export async function initializeConfigAPI(): Promise<void> {
	try {
		currentShowIsLoading.set(true);
		currentShowError.set(null);

		// Initialize show selection based on mode
		if (CONFIG.runtime.theater) {
			// In theater mode, get show ID from URL parameters
			const urlParams = new URLSearchParams(window.location.search);
			const showIdParam = urlParams.get("show");
			if (showIdParam) {
				const showId = parseInt(showIdParam);
				if (!isNaN(showId)) {
					await _setSelectedShow(showId);
				}
			}
		} else {
			// In stage mode, show ID comes from CONFIG
			if (CONFIG.stage.showId) {
				await _setSelectedShow(CONFIG.stage.showId);
			}
		}

		// Load current configuration
		await _updateConfig();
	} catch (error) {
		console.error("Failed to load show data:", error);
		currentShowError.set(error instanceof Error ? error.message : "Failed to initialize configuration API");
	} finally {
		currentShowIsLoading.set(false);
	}
}
