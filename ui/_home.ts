import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";

import Home from "~/components/pages/Home.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Mount the Svelte interface
const homeComponent = new Home({
	target: document.body,
	props: {},
});

export default homeComponent;
