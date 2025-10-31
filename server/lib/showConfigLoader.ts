import { Show } from "../models/Show";
import { TRPCError } from "@trpc/server";

/**
 * Show Configuration Loader - Handles loading show configuration for stage mode startup
 */

/**
 * Load show configuration by ID for stage mode
 * This function is called during server startup when --showId is provided
 */
export async function loadShowConfiguration(showId: number): Promise<any> {
	try {
		console.log(`[ShowConfigLoader] Loading configuration for show ID: ${showId}`);

		const show = await Show.findByPk(showId);

		if (!show) {
			throw new Error(`Show with ID ${showId} not found`);
		}

		const config = {
			id: show.id,
			name: show.name,
			description: show.description,
			nomenclature: show.nomenclature,
			showPassword: show.showPassword,
			curtainsOverride: show.curtainsOverride,
			chatEnabledOverride: show.chatEnabledOverride,
			effectsEnabledOverride: show.effectsEnabledOverride,
			visitorAudioEnabledOverride: show.visitorAudioEnabledOverride,
			visitorVideoEnabledOverride: show.visitorVideoEnabledOverride,
			currentScene: show.currentScene,
			createdAt: show.createdAt,
			updatedAt: show.updatedAt,
		};

		console.log(`[ShowConfigLoader] Successfully loaded show: ${show.name}`);
		console.log(`[ShowConfigLoader] Configuration summary:`);
		console.log(`  - Nomenclature: ${show.nomenclature}`);
		console.log(`  - Password protected: ${Boolean(show.showPassword && show.showPassword.trim() !== "")}`);
		console.log(`  - Current scene: ${show.currentScene?.name || "None"}`);
		console.log(`  - Curtains override: ${show.curtainsOverride}`);
		console.log(`  - Chat override: ${show.chatEnabledOverride}`);
		console.log(`  - Effects override: ${show.effectsEnabledOverride}`);
		console.log(`  - Visitor audio override: ${show.visitorAudioEnabledOverride}`);
		console.log(`  - Visitor video override: ${show.visitorVideoEnabledOverride}`);

		return config;
	} catch (error) {
		console.error(`[ShowConfigLoader] Error loading show configuration:`, error);
		throw error;
	}
}

/**
 * Validate show exists without loading full configuration
 */
export async function validateShowExists(showId: number): Promise<boolean> {
	try {
		const show = await Show.findByPk(showId);
		return show !== null;
	} catch (error) {
		console.error(`[ShowConfigLoader] Error validating show existence:`, error);
		return false;
	}
}

/**
 * Get basic show information for logging/display purposes
 */
export async function getShowInfo(showId: number): Promise<{ name: string; description: string; nomenclature: string } | null> {
	try {
		const show = await Show.findByPk(showId, {
			attributes: ["name", "description", "nomenclature"],
		});

		if (!show) {
			return null;
		}

		return {
			name: show.name,
			description: show.description,
			nomenclature: show.nomenclature,
		};
	} catch (error) {
		console.error(`[ShowConfigLoader] Error getting show info:`, error);
		return null;
	}
}

/**
 * Initialize show configuration on stage server startup
 * This should be called when the stage server starts with a showId
 */
export async function initializeStageWithShow(showId: number): Promise<void> {
	try {
		console.log(`[ShowConfigLoader] Initializing stage mode with show ID: ${showId}`);

		// Validate show exists first
		const exists = await validateShowExists(showId);
		if (!exists) {
			throw new Error(`Cannot initialize stage: Show with ID ${showId} does not exist`);
		}

		// Load the full configuration
		const config = await loadShowConfiguration(showId);

		// TODO: Apply configuration to room state if needed
		// For now, we just load and log the configuration
		// In the future, we might want to:
		// - Set initial room password from show.showPassword
		// - Apply scene overrides to room settings
		// - Load the current scene if specified

		console.log(`[ShowConfigLoader] Stage successfully initialized with show: ${config.name}`);

		// Store the loaded config globally for access by other parts of the application
		global.STAGE_SHOW_CONFIG = config;
	} catch (error) {
		console.error(`[ShowConfigLoader] Failed to initialize stage with show:`, error);
		throw error;
	}
}

/**
 * Get the currently loaded show configuration
 * Returns null if no show is loaded (e.g., stage mode without --showId)
 */
export function getCurrentShowConfig(): any | null {
	return global.STAGE_SHOW_CONFIG || null;
}

/**
 * Check if stage is running with a specific show configuration
 */
export function isStageRunningWithShow(): boolean {
	return Boolean(global.STAGE_SHOW_CONFIG);
}
