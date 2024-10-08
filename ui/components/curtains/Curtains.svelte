<script lang="ts">
	import { slide, blur } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import curtainsData from '~/assets/images/curtains.jpg.base64';
	import curtainsAnimatedSrc from '~/assets/images/curtains.gif';
	import dreamLoopSrc from '~/assets/sounds/dream-loop.wav';

	/** Curtains image src */
	let curtainsImageRef: HTMLImageElement;

	/** Dream sound loop */
	let dreamSnd = new Audio(dreamLoopSrc);

	// On curtain drop
	onMount(() => {
		// Replace the curtains with an animated image after its loaded
		var animatedImage = new Image();
		animatedImage.src = curtainsAnimatedSrc;
		animatedImage.onload = () => {
			setTimeout(() => (curtainsImageRef.src = curtainsAnimatedSrc), 1000);
		};

		// Try to play the curtain background music
		try {
			dreamSnd.autoplay = true;
			dreamSnd.loop = true;
			// dream.addEventListener('canplay', () => {
			dreamSnd.currentTime = 0;
			dreamSnd.volume = 0;
			dreamSnd.play();
		} catch {
			// Unable to play, probably no user interaction yet.
		}
		let interval: any;
		interval = setInterval(() => {
			if (dreamSnd.volume < 0.2) {
				dreamSnd.volume += 0.01;
			} else {
				clearInterval(interval);
			}
		}, 200);

		// });
	});

	// When the curtains are no longer visible...
	onDestroy(() => {
		dreamSnd.pause();
	});
</script>

<div class="curtains" transition:blur>
	<img
		bind:this={curtainsImageRef}
		class="curtains"
		src={curtainsData}
		in:slide={{ axis: 'y', duration: 1000 }}
		out:slide={{ axis: 'y', duration: 500, delay: 500 }}
	/>
</div>

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
</style>
