import "@babel/polyfill";
import { enableHotReloadingOnRebuilds } from "./api/development";
import { authenticate, subscribeToBackstageConfigurationChanges } from "./api";

import Home from "~/components/pages/Home.svelte";

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Initialize all required services in sequence
async function initializeHome() {
	try {
		// Authenticate as online
		await authenticate();

		// Enable configuration synchronization for real-time updates when changes are made
		await subscribeToBackstageConfigurationChanges();

		// Mount the Svelte interface after everything is ready
		const homeComponent = new Home({
			target: document.body,
			props: {},
		});

		return homeComponent;
	} catch (error) {
		console.error("Error initializing:", error);
	}
}

// Start the initialization
const homeComponent = initializeHome();

export default homeComponent;
