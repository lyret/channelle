<script lang="ts">
	import type { DataTypes } from '~/api';
	import { update } from '~/api';

	export let participant: DataTypes['participant'];

	let name: string = '';
	let loading: boolean = false;

	// Handle the submission
	async function onClick() {
		loading = true;

		update('participant', {
			where: { id: participant.id },
			data: { name },
		});
	}
</script>

<p class="label">Ange ditt namn för att fortsätta</p>
<input
	type="text"
	class="input is-rounded is-centered"
	bind:value={name}
	placeholder="Jag heter..."
	class:is-disabled={loading}
/>
<button
	class="button is-rounded is-primary mt-4 is-centered"
	on:click={onClick}
	class:is-loading={loading}
	disabled={!name}
	>Anslut
</button>
