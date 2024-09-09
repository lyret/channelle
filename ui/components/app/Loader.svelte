<script lang="ts">
	import { blur } from 'svelte/transition';

	/** Text to show below the progress bar */
	export let label: string = '';

	// Delays the rendering of the loader to avoid "pop-in" effect
	const delayEffect = 1000;
	let hidden = true;
	setTimeout(() => {
		hidden = false;
	}, delayEffect);
</script>

{#if !hidden}
	<section
		class="section is-flex is-justify-content-center"
		in:blur={{ duration: 1000 }}
		out:blur={{ duration: 500 }}
	>
		<div class="has-text-centered p-12 notification is-rounded">
			<progress class="progress is-primary" />
			<p class="is-family-code">
				{label}
			</p>
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
