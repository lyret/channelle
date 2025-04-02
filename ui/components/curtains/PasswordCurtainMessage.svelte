<script lang="ts">
	import { onMount } from "svelte";
	import {
		participantScenePassword,
		scenePasswordIsOk,
	} from "~/stores/scene/scenePassword";

	let inputRef: HTMLInputElement;
	let inputValue: string = "";
	let loading: boolean = false;
	let retrying: boolean = false;

	// Handle the submission
	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		participantScenePassword.set(inputValue);
		let stop = scenePasswordIsOk.subscribe((ok) => {
			if (ok && window.location.href != "/stage") {
				window.location.href = "/stage";
			}
		});
		setTimeout(() => {
			inputValue = "";
			retrying = true;
			loading = false;
			stop();
		}, 1500);
	}

	// Handle mount
	onMount(() => {
		if (inputRef) {
			inputRef.focus();
		}
	});
</script>

<p class="mb-2 is-family-default has-text-weight-bold">
	Ange lösenordet för att fortsätta
</p>
<div
	class="control is-fullwidth is-large is-centered has-text-centered"
	class:is-loading={loading}
>
	<form on:submit={onSubmit} class="form">
		<input
			type="text"
			autocomplete="off"
			data-1p-ignore
			bind:this={inputRef}
			class="input is-large is-centered has-text-centered"
			bind:value={inputValue}
			placeholder="Skriv lösenordet här"
			class:is-disabled={loading}
		/>
		{#if !loading}
			<input
				type="submit"
				value="Fortsätt"
				class="button is-fullwidth is-large mt-4 is-centered"
				class:is-loading={loading}
				disabled={!inputValue}
			/>
		{/if}
		{#if retrying && !loading}
			<p class="my-2 is-size-6 has-text-gray">Fel lösenord, försök igen</p>{/if}
	</form>
</div>

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
