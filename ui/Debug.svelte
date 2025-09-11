<script lang="ts">
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import { onPageLoad } from "./room";

	onMount(() => {
		onPageLoad();
	});
</script>

<main in:blur={{ delay: 500, duration: 1000 }}></main>

<style lang="scss">
	main {
		padding-left: 50px;
	}
</style>
