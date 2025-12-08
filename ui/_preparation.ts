import "@babel/polyfill";
import { enableHotReloadingOnRebuilds } from "./api/development";
import { subscribeToBackstageConfigurationChanges } from "./api/backstage";
import { authenticate, validateSessionWithServer } from "./api/auth";

import Preparation from "~/components/pages/Preparation.svelte";

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Initialize all required services in sequence before rendering
async function initialize() {
	try {
		// Authenticate as online
		await authenticate();

		// Validate admin session
		await validateSessionWithServer();

		// Enable configuration synchronization for real-time updates when changes are made
		await subscribeToBackstageConfigurationChanges();

		// Mount the Svelte interface after everything is ready
		new Preparation({
			target: document.body,
			props: {},
		});
	} catch (error) {
		console.error("Error initializing:", error);
	}
}

// Start the initialization
initialize();
