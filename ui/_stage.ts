import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { participateInTheMediaRoom, subscribeToBackstageConfigurationChanges } from "./api";
import Stage from "~/components/pages/Stage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Enable media session synchronization for real-time multimedia communication
subscribeToBackstageConfigurationChanges();

// Enable media session synchronization for real-time multimedia communication
participateInTheMediaRoom().then(() => {
	// Mount the Svelte interface after the media room is ready
	new Stage({
		target: document.body,
		props: {},
	});
});
