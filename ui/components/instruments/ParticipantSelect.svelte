<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import type { DataTypes } from '~/api';

	export let value: DataTypes['participant']['id'] | -1 = -1;

	export let participants: Array<DataTypes['participant']>;
</script>

<div class="select is-fullwidth">
	<select bind:value on:input={(e) => dispatch('change', e)}>
		<option value={-1} class="has-text-gray">- Ingen -</option>
		{#each participants as participant}
			<option value={participant.id}>{participant.name}</option>
		{/each}
	</select>
</div>
