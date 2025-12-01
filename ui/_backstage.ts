import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { authenticate, subscribeToBackstageConfigurationChanges } from "./api";
import Backstage from "~/components/pages/Backstage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Initialize all required services in sequence
async function initializeBackstage() {
	try {
		// Authenticate as online
		await authenticate();

		// Enable configuration synchronization for real-time updates when changes are made
		await subscribeToBackstageConfigurationChanges();

		// Mount the Svelte interface after everything is ready
		const backstageComponent = new Backstage({
			target: document.body,
			props: {},
		});

		return backstageComponent;
	} catch (error) {
		console.error("Error initializing:", error);
	}
}

// Start the initialization
const backstageComponent = initializeBackstage();

export default backstageComponent;
