import "@babel/polyfill";
import { enableMediaSoupDebugging } from "./lib/device/enableMediaSoupDebugging";
import { enableHotReloadingOnRebuilds } from "./routers/debug";

import DebugApp from "./Debug.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

const rootComponent = new DebugApp({
	target: document.body,
	props: {},
});

export default rootComponent;
