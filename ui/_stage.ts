import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { authenticate, participateInTheMediaRoom, subscribeToBackstageConfigurationChanges } from "./api";
import { startMuteEnforcement } from "./api/stageNew/peerMedia";
import Stage from "~/components/pages/Stage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Initialize all required services in sequence
async function initializeStage() {
	try {
		// Authenticate as online
		await authenticate();
		// Enable mute enforcement to stop streams when peer is muted via database
		startMuteEnforcement();
		// Enable configuration synchronization for real-time updates when changes are made
		await subscribeToBackstageConfigurationChanges();
		// Enable media session synchronization for real-time multimedia communication
		await participateInTheMediaRoom();

		// Mount the Svelte interface after everything is ready
		new Stage({
			target: document.body,
			props: {},
		});
	} catch (error) {
		console.error("Error initializing:", error);
	}
}

// Start the initialization
initializeStage();
