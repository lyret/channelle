<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { peerStore } from "~/api/room";

	const dispatch = createEventDispatcher<{ submit: void }>();

	// Handle the submission
	async function onClick() {
		dispatch("submit");
	}
</script>

<h1 class="title is-family-default">Välkommen tillbaka {$peerStore.name}!</h1>
<button class="button is-rounded is-primary mt-4 is-centered" on:click={onClick}>Anslut</button>

<style lang="scss">
	h1 {
		font-size: 2.5vw;
		@include mobile {
			font-size: 5vw;
		}
	}
	.button {
		border-radius: 0;
		font-size: 2.5vw;
		color: var(--channelle-menu-text-color);
		background-color: var(--channelle-menu-bg-color);
		border: none;
		text-decoration: underline;
		@include mobile {
			font-size: 7vw;
		}
	}
</style>
