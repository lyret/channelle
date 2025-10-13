import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";

import DebugApp from "~/components/pages/Debug.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Mount the Svelte interface
const debugComponent = new DebugApp({
	target: document.body,
	props: {},
});

export default debugComponent;
