export * from "./configClient";

// Re-export commonly used types and enums
export type { PublicShowData, ShowListItem, ShowAuthResponse, Scene, SceneSetting } from "../../types/serverSideTypes";
export type { ShowAttributes } from "../../../server/models";
export type { Optional } from "sequelize";

// Main exports for convenience
export {
	// Configuration management
	configManager,
	initializeConfigManager,
	initializeConfigAPI,
	clearConfigData,
	AppMode,

	// Configuration API
	getConfig,
	selectShow,
	setPassword,
	setSetting,
	setScene,
	resetSettings,
	updateShowMetadata,
	syncToShow,
	enableConfigSynchronization,

	// Show CRUD operations
	fetchShows,
	getShow,
	createShow,
	updateShow,
	deleteShow,
	authenticateShowAccess,
	authenticateTheaterAccess,

	// Convenience setting functions
	SceneSettings,

	// Core stores
	configStore,
	configLoadingStore,
	configErrorStore,
	showsStore,
	showsLoadingStore,
	showsErrorStore,
	currentModeStore,

	// Derived stores
	passwordStore,
	sceneSettingsStore,
	currentSceneStore,
	currentShowStore,
	selectedShowIdStore,
	onlineShowsStore,
	protectedShowsStore,
	publicShowsStore,
} from "./configClient";
