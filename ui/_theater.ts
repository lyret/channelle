import "@babel/polyfill";
import Theater from "~/components/pages/Theater.svelte";
import { validateSessionWithServer } from "./api/auth";

// Validate authenticationsession with the server
validateSessionWithServer();

// Mount the Svelte interface
const theaterComponent = new Theater({
	target: document.body,
	props: {},
});

export default theaterComponent;
