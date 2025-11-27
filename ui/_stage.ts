import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { authenticate, participateInTheMediaRoom, subscribeToBackstageConfigurationChanges } from "./api";
import Stage from "~/components/pages/Stage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Authenticate as online
authenticate();

// Enable media session synchronization for real-time multimedia communication
subscribeToBackstageConfigurationChanges();

// Enable media session synchronization for real-time multimedia communication
participateInTheMediaRoom()
	.then(() => {
		// Mount the Svelte interface after the media room is ready
		new Stage({
			target: document.body,
			props: {},
		});
	})
	.catch((error: any) => {
		console.error("Error before mounting the page component:", error);
	});
