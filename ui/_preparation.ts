import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";
import { enableConfigSynchronization } from "./api/config";
import { validateSessionWithServer } from "./api/auth";

import Preparation from "~/components/pages/Preparation.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Enable global config synchronization for real-time updates
enableConfigSynchronization();

// Validate authenticationsession with the server
validateSessionWithServer();

// Mount the Svelte interface
const preparationComponent = new Preparation({
	target: document.body,
	props: {},
});

export default preparationComponent;
