import "@babel/polyfill";
import Theater from "~/components/pages/Theater.svelte";


// Mount the Svelte interface
const theaterComponent = new Theater({
	target: document.body,
	props: {},
});

export default theaterComponent;
