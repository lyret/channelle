import { writable, get } from "svelte/store";
import type { PublicShowDataResponse, Scene, SceneSetting } from "../../../shared/types/show";
import { currentShowStore } from "./index";
import * as showConfigApi from "./config";
import * as roomApi from "../room";

/** Enum for application modes */
export enum AppMode {
	THEATER = "theater",
	STAGE = "stage",
}

/** Store for current application mode */
export const currentModeStore = writable<AppMode>(AppMode.STAGE);

/** Store for current show ID being configured */
export const currentShowIdStore = writable<number | null>(null);

/** Store for show configuration loading state */
export const configLoadingStore = writable<boolean>(false);

/** Store for show configuration error state */
export const configErrorStore = writable<string | null>(null);

/**
 * Configuration Manager - Provides a unified interface for instruments
 * to update settings regardless of whether they're in theater or stage mode
 */
export class ShowConfigManager {
	private showId: number | null = null;
	private mode: AppMode = AppMode.STAGE;

	constructor() {
		// Subscribe to mode and show ID changes
		currentModeStore.subscribe((mode) => {
			this.mode = mode;
		});

		currentShowIdStore.subscribe((showId) => {
			this.showId = showId;
		});
	}

	/**
	 * Initialize the configuration manager
	 */
	async initialize(): Promise<void> {
		try {
			configLoadingStore.set(true);
			configErrorStore.set(null);

			// Determine mode based on URL or CONFIG
			const isTheaterMode = window.location.pathname.includes("/preparation") || window.location.pathname.includes("/theater");

			const mode = isTheaterMode ? AppMode.THEATER : AppMode.STAGE;
			currentModeStore.set(mode);

			// In theater mode, get show ID from current show store or URL
			if (mode === AppMode.THEATER) {
				const currentShow = get(currentShowStore);
				if (currentShow) {
					currentShowIdStore.set(currentShow.id);
				} else {
					// Try to get from URL parameters
					const urlParams = new URLSearchParams(window.location.search);
					const showIdParam = urlParams.get("show");
					if (showIdParam) {
						const showId = parseInt(showIdParam, 10);
						if (!isNaN(showId)) {
							currentShowIdStore.set(showId);
						}
					}
				}
			} else {
				// In stage mode, show ID should come from CONFIG or CLI
				if (CONFIG.stage?.showId) {
					currentShowIdStore.set(CONFIG.stage.showId);
				}
			}

			console.log(`[ConfigManager] Initialized in ${mode} mode with show ID: ${this.showId}`);
		} catch (error) {
			console.error("[ConfigManager] Initialization error:", error);
			configErrorStore.set("Failed to initialize configuration manager");
		} finally {
			configLoadingStore.set(false);
		}
	}

	/**
	 * Update show password
	 */
	async updatePassword(password?: string): Promise<boolean> {
		console.log("[ConfigManager] updatePassword called:", {
			password,
			mode: this.mode,
			showId: this.showId,
		});

		if (this.mode === AppMode.THEATER && this.showId) {
			console.log("[ConfigManager] Using theater mode API");
			const success = await showConfigApi.updateShowPassword(this.showId, password);
			console.log("[ConfigManager] Theater API result:", success);
			if (success) {
				// Manually update the store in theater mode since we don't have room sync
				console.log("[ConfigManager] Updating store manually with:", password);
				roomApi.stagePasswordStore.set(password);
			}
			return success;
		} else if (this.mode === AppMode.STAGE) {
			console.log("[ConfigManager] Using stage mode API");
			// In stage mode, update through room API and sync to get updated state
			const success = await roomApi.setStagePassword(password);
			console.log("[ConfigManager] Stage API result:", success);
			if (success) {
				// Trigger room sync to get the updated password from server
				console.log("[ConfigManager] Triggering room sync");
				await roomApi.syncRoom();
				console.log("[ConfigManager] Room sync completed");
			}
			return success;
		}
		console.log("[ConfigManager] No valid mode/showId, returning false");
		return false;
	}

	/**
	 * Update curtains override setting
	 */
	async updateCurtainsOverride(value: SceneSetting): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.SceneOverrides.setCurtains(this.showId, value);
		} else if (this.mode === AppMode.STAGE) {
			return await roomApi.setStageCurtainsForced(value);
		}
		return false;
	}

	/**
	 * Update chat enabled override setting
	 */
	async updateChatEnabledOverride(value: SceneSetting): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.SceneOverrides.setChatEnabled(this.showId, value);
		} else if (this.mode === AppMode.STAGE) {
			return await roomApi.setStageChatEnabledForced(value);
		}
		return false;
	}

	/**
	 * Update effects enabled override setting
	 */
	async updateEffectsEnabledOverride(value: SceneSetting): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.SceneOverrides.setEffectsEnabled(this.showId, value);
		} else if (this.mode === AppMode.STAGE) {
			return await roomApi.setStageEffectsEnabledForced(value);
		}
		return false;
	}

	/**
	 * Update visitor audio enabled override setting
	 */
	async updateVisitorAudioEnabledOverride(value: SceneSetting): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.SceneOverrides.setVisitorAudio(this.showId, value);
		} else if (this.mode === AppMode.STAGE) {
			return await roomApi.setStageVisitorAudioEnabledForced(value);
		}
		return false;
	}

	/**
	 * Update visitor video enabled override setting
	 */
	async updateVisitorVideoEnabledOverride(value: SceneSetting): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.SceneOverrides.setVisitorVideo(this.showId, value);
		} else if (this.mode === AppMode.STAGE) {
			return await roomApi.setStageVisitorVideoEnabledForced(value);
		}
		return false;
	}

	/**
	 * Update current active scene
	 */
	async updateCurrentScene(scene: Scene): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.updateCurrentScene(this.showId, scene);
		} else if (this.mode === AppMode.STAGE) {
			return await roomApi.setScene(scene);
		}
		return false;
	}

	/**
	 * Update show metadata (name, description, and nomenclature)
	 * Only available in theater mode
	 */
	async updateMetadata(metadata: { name?: string; description?: string; nomenclature?: string }): Promise<boolean> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.updateShowMetadata(this.showId, metadata);
		} else if (this.mode === AppMode.STAGE) {
			// In stage mode, we don't allow changing show metadata during performance
			console.warn("[ConfigManager] Show metadata cannot be changed during live performance (stage mode)");
			return false;
		}
		return false;
	}

	/**
	 * Get current configuration
	 */
	async getCurrentConfig(): Promise<PublicShowDataResponse | null> {
		if (this.mode === AppMode.THEATER && this.showId) {
			return await showConfigApi.getShowConfig(this.showId);
		} else if (this.mode === AppMode.STAGE) {
			// In stage mode, we could potentially read from room state or show config
			// For now, return null as room state doesn't match the show config structure
			return null;
		}
		return null;
	}

	/**
	 * Check if configuration updates are available
	 */
	canUpdateConfig(): boolean {
		return (this.mode === AppMode.THEATER && this.showId !== null) || this.mode === AppMode.STAGE;
	}

	/**
	 * Get current mode
	 */
	getCurrentMode(): AppMode {
		return this.mode;
	}

	/**
	 * Get current show ID
	 */
	getCurrentShowId(): number | null {
		return this.showId;
	}
}

/** Global configuration manager instance */
export const configManager = new ShowConfigManager();

/**
 * Initialize the configuration manager (call this when the app starts)
 */
export async function initializeConfigManager(): Promise<void> {
	await configManager.initialize();
}
