<script lang="ts">
	import { update, DataTypes } from '~/api';

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
	<h1 class="title">Who are you?</h1>
	<input
		type="text"
		class="input is-rounded is-large is-centered"
		bind:value={name}
		placeholder="My name is..."
		class:is-disabled={loading}
	/>
	<button
		class="button is-rounded is-primary mt-4 is-large is-centered"
		on:click={onClick}
		class:is-loading={loading}>Enter</button
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
