<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	import type { DataTypes } from '~/lib';
	import { update } from '~/lib';

	export let participant: DataTypes['participant'];

	let name: string = '';
	let loading: boolean = false;

	// Handle the submission
	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		await update('participant', {
			where: { id: participant.id },
			data: { name },
		});
		dispatch('submit');
	}
</script>

<p class="label">Ange ditt namn för att fortsätta</p>
<form on:submit={onSubmit} class="form">
	<input
		type="text"
		class="input is-rounded is-centered"
		bind:value={name}
		placeholder="Jag heter..."
		class:is-disabled={loading}
	/>
	<input
		type="submit"
		class="button is-rounded is-primary mt-4 is-centered"
		class:is-loading={loading}
		disabled={!name}
		value="Anslut"
	/>
</form>
