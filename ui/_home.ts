import "@babel/polyfill";
import { enableHotReloadingOnRebuilds } from "./api/development";
import { authenticate, subscribeToBackstageConfigurationChanges } from "./api";

import Home from "~/components/pages/Home.svelte";

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Authenticate as online
authenticate();

// Enable configuration synchronization for real-time updates when changes are made
subscribeToBackstageConfigurationChanges();

// Mount the Svelte interface
const homeComponent = new Home({
	target: document.body,
	props: {},
});

export default homeComponent;
