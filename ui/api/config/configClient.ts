import { writable, derived } from "svelte/store";
import type { PublicShowData, ShowListItem, ShowAuthResponse, Scene, SceneSetting } from "../../types/serverSideTypes";
import type { ShowAttributes } from "../../../server/models";
import type { Optional } from "sequelize";

// Import tRPC clients
import { configClient, showsClient } from "../_trpcClient";

// Type aliases for client-side data (dates serialized as strings)
type PublicShowDataResponse = Omit<PublicShowData, "createdAt" | "updatedAt"> & {
	createdAt: string;
	updatedAt: string;
};

type ShowAuthResponseClient = Omit<ShowAuthResponse, "showData"> & {
	showData?: PublicShowDataResponse;
};

// Database-based types for creation and updates
type CreateShowData = Optional<ShowAttributes, "id" | "createdAt" | "updatedAt">;
type UpdateShowData = Partial<ShowAttributes> & { id: number };

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
// APPLICATION MODE MANAGEMENT
// ============================================================================

/** Application mode enumeration */
export enum AppMode {
	THEATER = "theater",
	STAGE = "stage",
}

/** Store for current application mode - determined from CONFIG.runtime.theater */
export const currentModeStore = writable<AppMode>(CONFIG.runtime.theater ? AppMode.THEATER : AppMode.STAGE);

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

/** Configuration loading state */
export const configLoadingStore = writable<boolean>(false);

// ============================================================================
// SHOW LIST MANAGEMENT STORES
// ============================================================================

/** Store containing all available shows in the system */
export const showsStore = writable<ShowListItem[]>([]);

/** Loading state for show operations */
export const showsLoadingStore = writable<boolean>(false);

/** Error state for show operations */
export const showsErrorStore = writable<string | null>(null);

// ============================================================================
// DERIVED STORES (Convenient views of configuration data)
// ============================================================================

/** Current password from configuration */
export const passwordStore = derived(configStore, ($config) => $config.password);

/** Current scene settings from configuration */
export const sceneSettingsStore = derived(configStore, ($config) => $config.sceneSettings);

/** Current active scene from configuration */
export const currentSceneStore = derived(configStore, ($config) => $config.currentScene);

/** Current show metadata from configuration */
export const currentShowStore = derived(configStore, ($config) => $config.showMetadata);

/** Currently selected show ID from configuration */
export const selectedShowIdStore = derived(configStore, ($config) => $config.selectedShowId);

/** Shows that are currently running/online - filtered from showsStore */
export const onlineShowsStore = derived(showsStore, ($shows) => $shows.filter((show) => show.isOnline));

/** Shows that require password authentication - filtered from showsStore */
export const protectedShowsStore = derived(showsStore, ($shows) => $shows.filter((show) => show.isPasswordProtected));

/** Shows that are publicly accessible (no password) - filtered from showsStore */
export const publicShowsStore = derived(showsStore, ($shows) => $shows.filter((show) => !show.isPasswordProtected));

// ============================================================================
// UNIFIED CONFIGURATION API
// ============================================================================

/**
 * Get current stage configuration
 * Returns complete configuration including runtime state and show metadata
 */
export async function getConfig(): Promise<void> {
	try {
		configLoadingStore.set(true);

		const config = await configClient.getConfig.query();
		configStore.set(config);
	} catch (error) {
		console.error("Failed to get configuration:", error);
	} finally {
		configLoadingStore.set(false);
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
		configLoadingStore.set(true);

		const result = await configClient.selectShow.mutate({ showId, loadIntoRuntime });

		// Refresh configuration after selection
		await getConfig();

		return result.success;
	} catch (error) {
		console.error("Failed to select show:", error);
		return false;
	} finally {
		configLoadingStore.set(false);
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

/**
 * Fetch all shows from the server and populate showsStore
 */
export async function fetchShows(): Promise<void> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const shows = await showsClient.list.query();
		showsStore.set(shows);
	} catch (error) {
		console.error("Failed to fetch shows:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to fetch shows");
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Get a specific show by ID
 *
 * @param id - The unique identifier of the show to fetch
 * @returns Promise<PublicShowDataResponse | null> - Show data or null if not found
 */
export async function getShow(id: number): Promise<PublicShowDataResponse | null> {
	try {
		showsErrorStore.set(null);
		const show = await showsClient.get.query({ id });
		return show;
	} catch (error) {
		console.error("Failed to get show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to get show");
		return null;
	}
}

/**
 * Create a new show in the system
 *
 * @param data - Show creation data
 * @returns Promise<PublicShowDataResponse | null> - Created show data or null if failed
 */
export async function createShow(data: CreateShowData): Promise<PublicShowDataResponse | null> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const show = await showsClient.create.mutate(data);

		// Refresh the shows list
		await fetchShows();

		return show;
	} catch (error) {
		console.error("Failed to create show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to create show");
		return null;
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Update an existing show's basic information
 *
 * @param data - Show update data with ID and fields to change
 * @returns Promise<PublicShowDataResponse | null> - Updated show data or null if failed
 */
export async function updateShow(data: UpdateShowData): Promise<PublicShowDataResponse | null> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const show = await showsClient.update.mutate(data);

		// Refresh the shows list
		await fetchShows();

		return show;
	} catch (error) {
		console.error("Failed to update show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to update show");
		return null;
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Delete a show from the system
 *
 * @param id - The unique identifier of the show to delete
 * @returns Promise<boolean> - true if deletion was successful
 */
export async function deleteShow(id: number): Promise<boolean> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const result = await showsClient.delete.mutate({ id });

		// Refresh the shows list
		await fetchShows();

		return result.success;
	} catch (error) {
		console.error("Failed to delete show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to delete show");
		return false;
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Authenticate access to a password-protected show
 *
 * @param showId - The ID of the show to authenticate against
 * @param password - The password to verify
 * @returns Promise<object> - Object with success flag, show data, and optional message
 */
export async function authenticateShowAccess(showId: number, password: string): Promise<{ success: boolean; show?: PublicShowDataResponse; message?: string }> {
	try {
		showsErrorStore.set(null);

		const result = (await showsClient.authenticate.mutate({ showId, password })) as ShowAuthResponseClient;

		return {
			success: result.success,
			show: result.showData,
			message: result.message,
		};
	} catch (error) {
		console.error("Failed to authenticate show access:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to authenticate show access";
		showsErrorStore.set(errorMessage);
		return {
			success: false,
			message: errorMessage,
		};
	}
}

/**
 * Authenticate theater access with global password
 *
 * @param password - The theater password to verify
 * @returns Promise<object> - Object with success flag and optional message
 */
export async function authenticateTheaterAccess(password: string): Promise<{ success: boolean; message?: string }> {
	try {
		showsErrorStore.set(null);

		const result = await showsClient.authenticateTheater.mutate({ password });

		return {
			success: result.success,
			message: result.message,
		};
	} catch (error) {
		console.error("Failed to authenticate theater access:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to authenticate theater access";
		showsErrorStore.set(errorMessage);
		return {
			success: false,
			message: errorMessage,
		};
	}
}

// ============================================================================
// CONVENIENCE SETTING FUNCTIONS
// ============================================================================

/**
 * Convenience functions for updating specific scene settings
 * Each function updates the specific setting with optional persistence
 */
export const SceneSettings = {
	/**
	 * Set curtains override setting
	 * @param value - 0=Auto, 1=Show, 2=Hide
	 * @param persistToShow - Whether to persist to selected show
	 */
	async setCurtains(value: SceneSetting, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
		return await setSetting("curtains", value, persistToShow);
	},

	/**
	 * Set chat enabled override setting
	 * @param value - 0=Auto, 1=Enable, 2=Disable
	 * @param persistToShow - Whether to persist to selected show
	 */
	async setChatEnabled(value: SceneSetting, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
		return await setSetting("chatEnabled", value, persistToShow);
	},

	/**
	 * Set gratitude effects enabled override setting
	 * @param value - 0=Auto, 1=Enable, 2=Disable
	 * @param persistToShow - Whether to persist to selected show
	 */
	async setGratitudeEffectsEnabled(value: SceneSetting, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
		return await setSetting("gratitudeEffectsEnabled", value, persistToShow);
	},

	/**
	 * Set critical effects enabled override setting
	 * @param value - 0=Auto, 1=Enable, 2=Disable
	 * @param persistToShow - Whether to persist to selected show
	 */
	async setCriticalEffectsEnabled(value: SceneSetting, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
		return await setSetting("criticalEffectsEnabled", value, persistToShow);
	},

	/**
	 * Set visitor audio enabled override setting
	 * @param value - 0=Auto, 1=Enable, 2=Disable
	 * @param persistToShow - Whether to persist to selected show
	 */
	async setVisitorAudioEnabled(value: SceneSetting, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
		return await setSetting("visitorAudioEnabled", value, persistToShow);
	},

	/**
	 * Set visitor video enabled override setting
	 * @param value - 0=Auto, 1=Enable, 2=Disable
	 * @param persistToShow - Whether to persist to selected show
	 */
	async setVisitorVideoEnabled(value: SceneSetting, persistToShow: boolean = false): Promise<{ success: boolean; error?: string }> {
		return await setSetting("visitorVideoEnabled", value, persistToShow);
	},
};

// ============================================================================
// LIFECYCLE FUNCTIONS
// ============================================================================

/**
 * Initialize the configuration API system
 * Sets up show selection based on application mode and loads initial configuration
 */
export async function initializeConfigAPI(): Promise<void> {
	try {
		configLoadingStore.set(true);

		// Mode is determined by CONFIG.runtime.theater
		const mode = CONFIG.runtime.theater ? AppMode.THEATER : AppMode.STAGE;
		currentModeStore.set(mode);

		// Initialize show selection based on mode
		if (mode === AppMode.THEATER) {
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

		// Load shows list
		await fetchShows();

		// Load current configuration
		await getConfig();
	} catch (error) {
		console.error("Failed to initialize configuration API:", error);
	} finally {
		configLoadingStore.set(false);
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

	showsStore.set([]);
	showsErrorStore.set(null);
	configLoadingStore.set(false);
	showsLoadingStore.set(false);
}

/**
 * Configuration Manager Class
 * Provides object-oriented interface for configuration management
 * (Maintains backward compatibility with existing showManager usage)
 */
export class ConfigManager {
	/**
	 * Initialize the configuration manager
	 */
	async initialize(): Promise<void> {
		await initializeConfigAPI();
	}

	/**
	 * Update password for currently selected show
	 */
	async updatePassword(password?: string): Promise<{ success: boolean; error?: string }> {
		return await setPassword(password, true); // Always persist in manager context
	}

	/**
	 * Update curtains override setting
	 */
	async updateCurtainsOverride(value: SceneSetting): Promise<{ success: boolean; error?: string }> {
		return await SceneSettings.setCurtains(value, true);
	}

	/**
	 * Update chat enabled override setting
	 */
	async updateChatEnabledOverride(value: SceneSetting): Promise<{ success: boolean; error?: string }> {
		return await SceneSettings.setChatEnabled(value, true);
	}

	/**
	 * Update gratitude effects enabled override setting
	 */
	async updateGratitudeEffectsEnabledOverride(value: SceneSetting): Promise<{ success: boolean; error?: string }> {
		return await SceneSettings.setGratitudeEffectsEnabled(value, true);
	}

	/**
	 * Update critical effects enabled override setting
	 */
	async updateCriticalEffectsEnabledOverride(value: SceneSetting): Promise<{ success: boolean; error?: string }> {
		return await SceneSettings.setCriticalEffectsEnabled(value, true);
	}

	/**
	 * Update visitor audio enabled override setting
	 */
	async updateVisitorAudioEnabledOverride(value: SceneSetting): Promise<{ success: boolean; error?: string }> {
		return await SceneSettings.setVisitorAudioEnabled(value, true);
	}

	/**
	 * Update visitor video enabled override setting
	 */
	async updateVisitorVideoEnabledOverride(value: SceneSetting): Promise<{ success: boolean; error?: string }> {
		return await SceneSettings.setVisitorVideoEnabled(value, true);
	}

	/**
	 * Update current scene
	 */
	async updateCurrentScene(scene: Scene): Promise<{ success: boolean; error?: string }> {
		return await setScene(scene, true);
	}

	/**
	 * Update show metadata
	 */
	async updateMetadata(metadata: { name?: string; description?: string; nomenclature?: string }): Promise<{ success: boolean; error?: string }> {
		return await updateShowMetadata(undefined, metadata);
	}

	/**
	 * Get current configuration
	 */
	async getCurrentConfig(): Promise<void> {
		await getConfig();
	}

	/**
	 * Check if configuration updates are available
	 */
	canUpdateConfig(): boolean {
		return true; // Always true with unified server-side configuration
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
			await getConfig();
		} catch (error) {
			console.error("Failed to sync config:", error);
		}
	}, 2000); // Check every 2 seconds
}

/**
 * Global configuration manager instance
 * Provides high-level configuration management with proper error handling and validation
 */
export const configManager = new ConfigManager();

/**
 * Initialize the configuration manager
 * Should be called when the app starts to set up configuration management
 */
export async function initializeConfigManager(): Promise<void> {
	await configManager.initialize();
}
