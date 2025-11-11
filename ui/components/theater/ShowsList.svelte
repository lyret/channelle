<script lang="ts">
	import ShowListEntry from "~/components/ShowListEntry.svelte";
	import { showsStore } from "~/api/config";

	// Separate shows into current/upcoming and previous
	$: currentShows = $showsStore.filter(show => show.isOnline || show.lastOnlineAt === null);
	$: previousShows = $showsStore.filter(show => !show.isOnline && show.lastOnlineAt !== null);
</script>

<div class="box">
	<!-- Current and upcoming shows -->
	{#each currentShows as show (show.url)}
		<ShowListEntry {show} />
	{/each}

	<!-- Divider for previous shows (only show if there are previous shows) -->
	{#if previousShows.length > 0}
		<hr class="previous-shows-divider" />
		<h6 class="title is-6 has-text-grey previous-shows-title">Tidigare föreställningar</h6>

		<!-- Previous shows -->
		{#each previousShows as show (show.url)}
			<ShowListEntry {show} />
		{/each}
	{/if}

	<!-- Empty state -->
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

	.previous-shows-divider {
		margin: 2rem 0 1rem 0;
		background-color: rgba(255, 255, 255, 0.2);
		height: 1px;
		border: none;
	}

	.previous-shows-title {
		margin-bottom: 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		opacity: 0.7;
	}
</style>
