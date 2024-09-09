<script lang="ts">
	import { blur } from 'svelte/transition';
	import type { DataTypes } from '~/api';
	import { update } from '~/api';
	import flowerSrc from '~/assets/images/flower.png';

	export let participant: DataTypes['participant'];

	let name: string = '';
	let loading: boolean = true;

	// Delays the rendering of the prompt to avoid "pop-in" effect
	const delayEffect = 200;
	setTimeout(() => {
		loading = false;
	}, delayEffect);

	// Handle the submission
	async function onClick() {
		loading = true;
		setTimeout(() => {
			update('participant', {
				where: { id: participant.id },
				data: { name },
			});
		}, delayEffect);
	}
</script>

{#if !loading}
	<section
		class="section is-flex is-justify-content-center"
		in:blur={{ duration: 500 }}
		out:blur={{ duration: 500 }}
	>
		<div class="has-text-centered p-12 notification is-rounded">
			<img src={flowerSrc} alt="a kalidoscope of a flower " />
			<h1 class="is-family-monospace is-size-4">
				Ange ditt namn för att fortsätta
			</h1>
			<input
				type="text"
				class="input is-rounded is-centered"
				bind:value={name}
				placeholder="Jag heter..."
				class:is-disabled={loading}
			/>
			<button
				class="button is-rounded is-family-monospace is-primary mt-4 is-centered"
				on:click={onClick}
				class:is-loading={loading}
				disabled={!name}
				>FORTSÄTT
			</button>
		</div>
	</section>
{/if}

<style>
	.notification {
		margin-top: 10%;
		min-width: 150px;
		width: 30%;
	}
</style>
