<script lang="ts">
	import type { DataTypes } from '~/api';
	import { update } from '~/api';

	export let participant: DataTypes['participant'];

	let name: string = '';
	let loading: boolean = false;
	async function onClick() {
		loading = true;
		await update('participant', {
			where: { id: participant.id },
			data: { name },
		});
	}
</script>

<div class="has-text-centered p-12 notification is-rounded">
	<h1 class="is-family-secondary is-size-3">Vem e du?</h1>
	<input
		type="text"
		class="input is-rounded is-centered"
		bind:value={name}
		placeholder="Jag heter..."
		class:is-disabled={loading}
	/>
	<button
		class="button is-rounded is-primary mt-4 is-centered is-family-monospace"
		on:click={onClick}
		class:is-loading={loading}>Enter Channelle</button
	>
</div>

<style>
	.notification {
		margin-top: 10%;
		width: 20%;
		max-width: 20%;
		margin-left: 40%;
	}
</style>
