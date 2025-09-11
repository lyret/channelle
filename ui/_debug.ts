import "@babel/polyfill";
import { enableMediaSoupDebugging } from "./lib/device/enableMediaSoupDebugging";

import DebugApp from "./Debug.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

const rootComponent = new DebugApp({
	target: document.body,
	props: {},
});

export default rootComponent;
