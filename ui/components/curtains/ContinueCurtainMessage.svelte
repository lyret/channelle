<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DataTypes } from '~/lib';

	const dispatch = createEventDispatcher();

	export let participant: DataTypes['participant'];

	const name: string = '';
	const loading: boolean = false;

	// Handle the submission
	async function onClick() {
		dispatch('click');
	}
</script>

<p class="label">Välkommen tillbaka {participant.name}!</p>
<button
	class="button is-rounded is-primary mt-4 is-centered"
	on:click={onClick}
	class:is-loading={loading}
	>Anslut
</button>
