<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import type { DataTypes } from "~/lib";

	const dispatch = createEventDispatcher();

	export let participant: DataTypes["participant"];

	const name: string = "";
	const loading: boolean = false;

	// Handle the submission
	async function onClick() {
		dispatch("click");
	}
</script>

<h1 class="title is-family-default">Välkommen tillbaka {participant.name}!</h1>
<button
	class="button is-rounded is-primary mt-4 is-centered"
	on:click={onClick}
	class:is-loading={loading}
	>Anslut
</button>

<style lang="scss">
	h1 {
		font-size: 2.5vw;
		@include mobile {
			font-size: 5vw;
		}
	}
	.icon {
		transform: scale(2);
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
