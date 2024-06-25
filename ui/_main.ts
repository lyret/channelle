import "@babel/polyfill";

import App from "./App.svelte";

var mainComponent = new App({
  target: document.body,
});

export default mainComponent;
