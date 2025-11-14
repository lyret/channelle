<script lang="ts">
	import TheaterWrapper from "~/components/theater/_TheaterWrapper.svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "../theater/TheaterActionBar.svelte";
	import ShowListEntry from "~/components/ShowListEntry.svelte";
	import IconPlus from "~/components/picol/icons/Picol-plus.svelte";
	import IconSettings from "~/components/picol/icons/Picol-settings.svelte";

	import { onMount } from "svelte";
	import { showsListStore, showsStoreIsLoading, showsErrorStore, fetchShows } from "~/api/shows";
	import { openCreateShowModal, openLauncherModal } from "~/stores/theaterModals";
	import { isTheaterAuthenticated } from "~/api/auth";

	// Use reactive statement to get shows from store
	$: isLoadingShows = $showsStoreIsLoading;
	$: showsError = $showsErrorStore;

	// Separate shows into current/upcoming and previous
	$: currentShows = $showsListStore.filter((show) => show.isOnline || show.lastOnlineAt === null);
	$: previousShows = $showsListStore.filter((show) => !show.isOnline && show.lastOnlineAt !== null);

	onMount(async () => {
		await fetchShows();
	});
</script>

<TheaterWrapper>
	<!-- Header -->
	<TheaterHeader />
	<!-- Main content area with columns -->
	<section class="section theater-content">
		<div class="column-background left-column"></div>
		<div class="column-background right-column"></div>

		<TheaterActionBar>
			{#if $isTheaterAuthenticated}
				<button class="button is-small" on:click={openCreateShowModal}>
					<span class="icon is-size-4">
						<IconPlus />
					</span>
					<span class="is-family-secondary">Skapa en ny föreställning</span>
				</button>
				<button class="button is-small is-outlined" on:click={openLauncherModal}>
					<span class="icon is-size-4">
						<IconSettings />
					</span>
					<span class="is-family-secondary">Serverhantering</span>
				</button>
			{/if}
		</TheaterActionBar>

		<div class="container is-fluid">
			<div class="container content-container">
				<!-- Shows list section -->
				{#if isLoadingShows}
					<div class="box">
						<div class="has-text-centered">
							<div class="is-loading"></div>
							<p class="is-family-secondary">Hämtar föreställningar...</p>
						</div>
					</div>
				{:else if showsError}
					<div class="box">
						<div class="notification is-danger">
							<p class="is-family-secondary">Ojdå, ett tekniskt fel: {showsError}</p>
							<button class="button is-small is-light is-outlined mt-2" on:click={fetchShows}> Försök igen </button>
						</div>
					</div>
				{:else}
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
						{#if $showsListStore.length === 0}
							<div class="notification is-light">
								<p class="is-family-secondary has-text-grey">Det finns inga föreställningar att visa just nu.</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</section>
</TheaterWrapper>

<style lang="scss">
	.section {
		flex: 1;
		position: relative;
	}

	.theater-content {
		position: relative;
		overflow-x: hidden;
	}

	.notification {
		border-radius: 8px;
	}

	.column-background {
		position: fixed;
		top: 0;
		bottom: 0;
		width: 80px;
		background-image: url("~/assets/gifs/fiori.gif");
		background-repeat: repeat-y;
		background-size: contain;
		background-position: center;
		pointer-events: none;
		z-index: 0;
		opacity: 0.6;
	}

	.left-column {
		left: 20px;
	}

	.right-column {
		right: 20px;
	}

	.content-container {
		position: relative;
		z-index: 1;
		border-radius: 8px;
		padding: 1.5rem;
		padding-top: 0;
		margin: 0 auto;
		max-width: 1200px;
	}

	// Hide columns on smaller screens
	@media screen and (max-width: 1024px) {
		.column-background {
			display: none;
		}

		.content-container {
			background: transparent;
			padding: 0;
		}
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
