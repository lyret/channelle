import { writable, derived } from "svelte/store";
import type { PublicShowData, Scene, SceneSetting } from "../../types/serverSideTypes";

// Import tRPC clients
import { configClient } from "../_trpcClient";

// Type aliases for client-side data (dates serialized as strings)
type PublicShowDataResponse = Omit<PublicShowData, "createdAt" | "updatedAt"> & {
	createdAt: string;
	updatedAt: string;
};

/**
 * Configuration Client - Unified stage configuration management
 *
 * This module provides comprehensive configuration management functionality including:
 * - Unified server-side show selection and configuration
 * - Show CRUD operations (create, read, update, delete)
 * - Runtime configuration (passwords, scene settings, layouts)
 * - Real-time configuration synchronization
 * - Theater and stage mode support through unified API
 *
 * The client mirrors the server's unified configuration architecture where:
 * - configRouter handles runtime configuration with optional persistence
 * - showsRouter handles basic CRUD operations
 * - All configuration operations work against a server-selected show
 */

// ============================================================================
// CONFIGURATION STATE STORES
// ============================================================================

/**
 * Complete configuration state store
 * Contains all current runtime configuration including show metadata
 */
export const configStore = writable<{
	// Runtime configuration
	password?: string;
	sceneSettings: {
		curtains: SceneSetting;
		chatEnabled: SceneSetting;
		gratitudeEffectsEnabled: SceneSetting;
		criticalEffectsEnabled: SceneSetting;
		visitorAudioEnabled: SceneSetting;
		visitorVideoEnabled: SceneSetting;
	};
	currentScene?: {
		name: string;
		layout: any[][];
		curtains: boolean;
		chatEnabled: boolean;
		gratitudeEffectsEnabled: boolean;
		criticalEffectsEnabled: boolean;
		visitorAudioEnabled: boolean;
		visitorVideoEnabled: boolean;
	};
	// Show metadata (if available)
	selectedShowId?: number;
	showMetadata?: PublicShowDataResponse | null;
}>({
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
export const showPasswordStore = derived(configStore, ($config) => $config.password);

/** Current scene settings from configuration */
export const showSceneOverridesStores = derived(configStore, ($config) => $config.sceneSettings);

/** Current active scene from configuration */
export const showSceneSelectionStores = derived(configStore, ($config) => $config.currentScene);

/** Current show metadata from configuration */
export const showMetadataStore = derived(configStore, ($config) => $config.showMetadata);

/** Currently selected show ID from configuration */
export const showSelectedIdStore = derived(configStore, ($config) => $config.selectedShowId);

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
export async function getConfig(): Promise<void> {
	try {
		currentShowError.set(null);
		const config = await configClient.getConfig.query();
		configStore.set(config);
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
 * @param loadIntoRuntime - Whether to load show configuration into runtime state
 * @returns Promise<boolean> - true if selection was successful
 */
export async function selectShow(showId?: number, loadIntoRuntime: boolean = false): Promise<boolean> {
	try {
		currentShowIsLoading.set(true);
		currentShowError.set(null);

		const result = await configClient.selectShow.mutate({ showId, loadIntoRuntime });

		// Refresh configuration after selection
		await getConfig();

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
		const result = await configClient.setPassword.mutate({ password, persistToShow });

		// Refresh configuration after change
		await getConfig();

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
		const result = await configClient.setSetting.mutate({ key, value, persistToShow });

		// Refresh configuration after change
		await getConfig();

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
		const result = await configClient.setScene.mutate({ scene, persistToShow });

		// Refresh configuration after change
		await getConfig();

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
		const result = await configClient.resetSettings.mutate({ persistToShow });

		// Refresh configuration after change
		await getConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to reset settings:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to reset settings";

		return { success: false, error: errorMessage };
	}
}

/**
 * Update show metadata (name, description, nomenclature)
 *
 * @param showId - Show ID (optional, uses selected show if not provided)
 * @param metadata - Metadata fields to update
 * @returns Promise<{success: boolean, error?: string}> - result with success status and optional error
 */
export async function updateShowMetadata(
	showId?: number,
	metadata: { name?: string; description?: string; nomenclature?: string } = {},
): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await configClient.updateShowMetadata.mutate({ showId, ...metadata });

		// Refresh configuration after change
		await getConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to update show metadata:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to update show metadata";
		return { success: false, error: errorMessage };
	}
}

/**
 * Sync current runtime configuration to selected show
 * Persists all runtime state to the selected show
 *
 * @returns Promise<{success: boolean, error?: string}> - result with success status and optional error
 */
export async function syncToShow(): Promise<{ success: boolean; error?: string }> {
	try {
		const result = await configClient.syncToShow.mutate();

		// Refresh configuration after sync
		await getConfig();

		return { success: result.success };
	} catch (error) {
		console.error("Failed to sync to show:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to sync to show";
		return { success: false, error: errorMessage };
	}
}

// ============================================================================
// SHOW CRUD OPERATIONS
// ============================================================================

// ============================================================================
// LIFECYCLE FUNCTIONS
// ============================================================================

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
				const showId = parseInt(showIdParam, 10);
				if (!isNaN(showId)) {
					await selectShow(showId, true); // Load show config into runtime
				}
			}
		} else {
			// In stage mode, show ID comes from CONFIG
			if (CONFIG.stage?.showId) {
				await selectShow(CONFIG.stage.showId, true); // Load show config into runtime
			}
		}

		// Load current configuration
		await getConfig();
	} catch (error) {
		console.error("Failed to initialize configuration API:", error);
		currentShowError.set(error instanceof Error ? error.message : "Failed to initialize configuration API");
	} finally {
		currentShowIsLoading.set(false);
	}
}

/**
 * Clear all configuration data and reset stores to initial state
 * Useful for logout scenarios or when switching contexts
 */
export function clearConfigData(): void {
	configStore.set({
		password: undefined,
		sceneSettings: {
			curtains: 0,
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

	// Clear loading and error states
	currentShowIsLoading.set(false);
	currentShowError.set(null);
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
			await getConfig();
		} catch (error) {
			console.error("Failed to sync config:", error);
		}
	}, 2000); // Check every 2 seconds
}
