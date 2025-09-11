import "@babel/polyfill";
import { enableMediaSoupDebugging } from "./lib/device/enableMediaSoupDebugging";

import App from "./App.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

const mainComponent = new App({
	target: document.body,
	props: {
		name: CONFIG.stage.name,
	},
});

export default mainComponent;
