import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { subscribeToBackstageConfigurationChanges } from "./api/backstage";

import Backstage from "~/components/pages/Backstage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Enable configuration synchronization for real-time updates when changes are made
subscribeToBackstageConfigurationChanges();

// Mount the Svelte interface
const backstageComponent = new Backstage({
	target: document.body,
	props: {},
});

export default backstageComponent;
