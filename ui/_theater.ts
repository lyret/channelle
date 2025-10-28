import TheaterHome from "~/components/pages/TheaterHome.svelte";

// Mount the Svelte interface
const theaterComponent = new TheaterHome({
	target: document.body,
	props: {},
});

export default theaterComponent;
