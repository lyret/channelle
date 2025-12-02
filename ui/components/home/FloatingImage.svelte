<script lang="ts">
	import { onMount } from "svelte";

	export let src: string;
	export let alt: string = "";
	export let zIndex: number = 0;

	const interval = 5000 + Math.random() * 10000;

	let x = Math.round(100 * Math.random());
	let y = Math.round(100 * Math.random());
	let scale = 1 + Math.random() / 2;
	let rotation = -20 + Math.round(40 * Math.random());

	onMount(() => {
		setInterval(() => {
			x = Math.round(100 * Math.random());
			y = Math.round(100 * Math.random());
			scale = 1 + Math.random();
			rotation = -10 + Math.round(20 * Math.random());
		}, interval);
	});
</script>

<img
	{src}
	{alt}
	style={`
        top: ${x}vh;
        left: ${y}vw;
        transform: rotate(${rotation}deg) scale(${scale});
        z-index: ${zIndex};
        position: fixed;
		transition: all 1500ms;
    `}
/>
