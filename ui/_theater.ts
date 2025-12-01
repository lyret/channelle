import "@babel/polyfill";
import Theater from "~/components/pages/Theater.svelte";
import { enableHotReloadingOnRebuilds } from "./api/development";
import { authenticate, validateSessionWithServer } from "./api/auth";

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Initialize all required services in sequence before rendering
async function initialize() {
	try {
		// Authenticate as online
		await authenticate();

		// Authenticate as admin
		await validateSessionWithServer();

		// Mount the Svelte interface after everything is ready
		new Theater({
			target: document.body,
			props: {},
		});
	} catch (error) {
		console.error("Error initializing:", error);
	}
}

// Start the initialization
initialize();
