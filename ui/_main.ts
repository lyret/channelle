import '@babel/polyfill';
import { enableMediaSoupDebugging } from './functions/enableMediaSoupDebugging';

import App from './App.svelte';

// Set correct debug output level for MediaSoup
enableMediaSoupDebugging();

var mainComponent = new App({
  target: document.body,
});

export default mainComponent;
