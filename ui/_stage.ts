import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";

import Stage from "./Stage.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Mount the Svelte interface
const stageComponent = new Stage({
	target: document.body,
	props: {},
});

export default stageComponent;
