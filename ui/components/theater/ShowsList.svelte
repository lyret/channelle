<script lang="ts">
	import ShowListEntry from "~/components/ShowListEntry.svelte";
	import { showsStore } from "~/api/config";
</script>

<div class="box">
	{#each $showsStore as show (show.url)}
		<ShowListEntry {show} />
	{/each}
	{#if $showsStore.length === 0}
		<div class="notification is-light">
			<p class="is-family-secondary has-text-grey">Det finns inga föreställningar att visa just nu.</p>
		</div>
	{/if}
</div>

<style>
	.box {
		margin-top: 4rem;
	}
</style>
