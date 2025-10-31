import "@babel/polyfill";
import { enableMediaSoupDebugging, enableHotReloadingOnRebuilds } from "./api/development";

import Preparation from "~/components/pages/Preparation.svelte";

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

// Enables hot reloading of the debug app when developing
enableHotReloadingOnRebuilds();

// Mount the Svelte interface
const preparationComponent = new Preparation({
	target: document.body,
	props: {},
});

export default preparationComponent;
