import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { subscribeToBackstageConfigurationChanges } from "./api";
import Stage from "~/components/pages/Stage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Enable configuration synchronization for real-time updates when changes are made
subscribeToBackstageConfigurationChanges();

// Mount the Svelte interface
const stageComponent = new Stage({
	target: document.body,
	props: {},
});

export default stageComponent;
