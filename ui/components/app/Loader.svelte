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
		class="section"
		in:blur={{ duration: 1000 }}
		out:blur={{ duration: 500 }}
	>
		<div class="container">
			<div class="columns is-centered is-vcentered">
				<div class="column is-5 has-text-centered">
					<progress class="progress is-primary" />
					<p class="is-family-code">
						{label}
					</p>
				</div>
			</div>
		</div>
	</section>
{/if}
