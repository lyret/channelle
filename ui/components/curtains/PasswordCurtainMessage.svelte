<script lang="ts">
	import { onMount } from 'svelte';
	import { blur, scale } from 'svelte/transition';
	import { participantScenePassword } from '~/stores/scene/scenePassword';

	let inputRef: HTMLInputElement;
	let inputValue: string = '';
	let loading: boolean = false;
	let retrying: boolean = false;

	// Handle the submission
	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		participantScenePassword.set(inputValue);
		setTimeout(() => {
			inputValue = '';
			retrying = true;
			loading = false;
		}, 1500);
	}

	// Handle mount
	onMount(() => {
		if (inputRef) {
			inputRef.focus();
		}
	});
</script>

<p class="mb-2 is-size-4 is-family-title has-text-weight-bold">
	Scenen är låst
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
			placeholder="Lösenord"
			class:is-disabled={loading}
		/>
		{#if !loading}
			<input
				type="submit"
				value="Öppna"
				in:scale
				class="button is-fullwidth is-large is-primary mt-4 is-centered"
				class:is-loading={loading}
				disabled={!inputValue}
			/>
		{/if}
		{#if retrying}
			<p in:blur class="my-2 is-size-6 has-text-gray">
				Fel lösenord, försök igen
			</p>{/if}
	</form>
</div>
