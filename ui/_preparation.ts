import "@babel/polyfill";
import { enableHotReloadingOnRebuilds } from "./api/development";
import { subscribeToBackstageConfigurationChanges } from "./api/backstage";
import { validateSessionWithServer } from "./api/auth";

import Preparation from "~/components/pages/Preparation.svelte";

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Enable configuration synchronization for real-time updates when changes are made
subscribeToBackstageConfigurationChanges();

// Validate authentication sessions with the server
validateSessionWithServer();

// Mount the Svelte interface
const preparationComponent = new Preparation({
	target: document.body,
	props: {},
});

export default preparationComponent;
