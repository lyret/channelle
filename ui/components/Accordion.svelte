<script lang="ts">
	import { createEventDispatcher } from "svelte";

	export let isOpen = false;
	export let title: string;
	export let subtitle: string = "";

	const dispatch = createEventDispatcher<{ toggle: boolean }>();

	function toggle() {
		isOpen = !isOpen;
		dispatch("toggle", isOpen);
	}
</script>

<div class="accordion">
	<button class="accordion-header button is-fullwidth is-justify-content-space-between" class:is-primary={isOpen} on:click={toggle}>
		<div class="accordion-title-section">
			<span class="title is-5">{title}</span>
			{#if subtitle}
				<span class="subtitle is-6 has-text-left">{subtitle}</span>
			{/if}
		</div>
		<span class="icon">
			<i class="fas" class:fa-chevron-down={!isOpen} class:fa-chevron-up={isOpen}></i>
		</span>
	</button>

	{#if isOpen}
		<div class="accordion-content box mt-2">
			<slot />
		</div>
	{/if}
</div>

<style>
	.accordion-header {
		text-align: left;
		border: 1px solid #dbdbdb;
	}

	.accordion-title-section {
		text-align: left;
	}

	.accordion-content {
		border-top: none;
		margin-top: 0;
	}
</style>
