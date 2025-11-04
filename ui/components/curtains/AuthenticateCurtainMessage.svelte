<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { get } from "svelte/store";
	import { peerStore, updatePeerName } from "~/api/media";

	const dispatch = createEventDispatcher<{ submit: void }>();

	let loading: boolean = false;
	let name: string = "";

	// Handle the submission
	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		await updatePeerName(get(peerStore).id, name);
		dispatch("submit");
	}
</script>

<p class="label">Ange ditt namn för att fortsätta</p>
<form on:submit={onSubmit} class="form">
	<input type="text" class="input is-rounded is-centered" bind:value={name} placeholder="Skriv ditt namn här" class:is-disabled={loading} />
	<input type="submit" class="button is-rounded is-primary mt-4 is-centered" class:is-loading={loading} disabled={!name} value="Anslut" />
</form>

<style lang="scss">
	p,
	.input,
	.input::after,
	.button {
		border-radius: 0;
		font-size: 2.5vw;
		@include mobile {
			font-size: 7vw;
		}
	}

	.button {
		color: var(--channelle-menu-text-color);
		background-color: var(--channelle-menu-bg-color);
		border: none;
		text-decoration: underline;
	}

	.input {
		color: var(--channelle-menu-text-color);
		background: none;
		border: none;
		box-shadow: none;
		border-bottom: 2px solid var(--channelle-menu-bg-color);
	}

	::placeholder {
		text-align: center;
		color: var(--channelle-menu-text-color);
		opacity: 0.8;
	}

	.button:hover {
		transform: scale(1.05);
	}
	.button:disabled {
		opacity: 1;
		text-decoration: line-through;
	}
</style>
