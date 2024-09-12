<script lang="ts">
	import { slide, blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	import curtainsSrc from '~/assets/images/curtains.jpg';
	import curtainsAnimatedSrc from '~/assets/images/curtains.gif';

	let muted = true;
	let ref: HTMLImageElement;

	onMount(() => {
		var animatedImage = new Image();
		animatedImage.src = curtainsAnimatedSrc;
		animatedImage.onload = () => {
			setTimeout(() => (ref.src = curtainsAnimatedSrc), 1000);
		};
	});
</script>

<!-- Make sure the curtain image is preloaded, also done in index.html -->
<svelte:head>
	<link rel="preload" as="image" href={curtainsSrc} />
</svelte:head>

<div class="curtains" transition:blur>
	<img
		bind:this={ref}
		class="curtains"
		src={curtainsSrc}
		in:slide={{ axis: 'y', duration: 1000 }}
		out:slide={{ axis: 'y', duration: 500, delay: 500 }}
	/>
</div>

{#if muted}
	<div
		class="overlay"
		in:blur={{ delay: 1200, duration: 500 }}
		out:blur={{ delay: 0, duration: 500 }}
	>
		<div
			class="notification"
			in:blur={{ delay: 1200, duration: 500 }}
			out:blur={{ delay: 0, duration: 500 }}
		>
			<button
				class="button is-large is-dark is-rounded"
				on:click={() => (muted = false)}>Gå in</button
			>
		</div>
	</div>
{/if}

<style>
	.curtains {
		z-index: 9998;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		object-fit: cover;
	}

	.overlay {
		z-index: 9999;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background: rgb(0, 0, 0, 0);
		/* -webkit-backdrop-filter: blur(10px); */
		/* backdrop-filter: blur(10px); */
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: center;
		align-content: center;
		overflow: none;
	}
	.overlay .button {
		display: block;
	}
</style>
