<script lang="ts">
	import TheaterWrapper from "~/components/theater/_TheaterWrapper.svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "../theater/TheaterActionBar.svelte";
	import ShowListEntry from "~/components/ShowListEntry.svelte";
	import IconPlus from "~/components/picol/icons/Picol-plus.svelte";
	import IconServer from "~/components/picol/icons/Picol-server.svelte";
	import IconClock from "~/components/picol/icons/Picol-clock.svelte";

	import { onMount } from "svelte";
	import { showsListStore, showsStoreIsLoading, showsErrorStore, fetchShows } from "~/api/shows";
	import { openCreateShowModal, openRemoteServerModal, openHistoryModal } from "~/stores/theater/theaterModals";
	import { isTheaterAuthenticated } from "~/api/auth";
	import { remoteServerStatusStore } from "~/api/theater";

	$: publicShows = $showsListStore.filter((show) => show.isPublic);
	$: hiddenShows = $showsListStore.filter((show) => !show.isPublic);
	$: activeRemoteShowId = $remoteServerStatusStore?.backstageConfiguration?.showId || null;
	$: console.log($remoteServerStatusStore);

	// Sort public shows to put the currently playing one first
	$: sortedPublicShows = [...publicShows].sort((a, b) => {
		const aIsPlaying = activeRemoteShowId === a.id && !$remoteServerStatusStore?.isEnded ? 1 : 0;
		const bIsPlaying = activeRemoteShowId === b.id && !$remoteServerStatusStore?.isEnded ? 1 : 0;
		return bIsPlaying - aIsPlaying; // Currently playing shows come first
	});
	onMount(async () => {
		await fetchShows();
	});

	function openRemoteStage(path?: string) {
		const stageUrl = CONFIG.ipc.stageUrl;
		window.open(`${stageUrl}${path || "/stage"}`, "_blank");
	}
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
				<button class="button is-small is-outlined" on:click={() => openRemoteServerModal()}>
					<span class="icon is-size-4">
						<IconServer />
					</span>
					<span class="is-family-secondary">Hantera scenen</span>
				</button>
				<button class="button is-small is-outlined" on:click={() => openHistoryModal()}>
					<span class="icon is-size-4">
						<IconClock />
					</span>
					<span class="is-family-secondary">Historik</span>
				</button>
			{/if}
		</TheaterActionBar>

		<div class="container is-fluid mt-6">
			<div class="container content-container">
				<!-- Shows list section -->
				{#if $showsStoreIsLoading}
					<div class="box">
						<div class="has-text-centered">
							<div class="is-loading"></div>
							<p class="is-family-secondary">Hämtar föreställningar...</p>
						</div>
					</div>
				{:else if $showsErrorStore}
					<div class="box">
						<div class="notification is-danger">
							<p class="is-family-secondary">Ojdå, ett tekniskt fel: {$showsErrorStore}</p>
							<button class="button is-small is-light is-outlined mt-2" on:click={fetchShows}> Försök igen </button>
						</div>
					</div>
				{:else}
					<div>
						<!-- Public shows -->
						{#each sortedPublicShows as show, index (show.id)}
							<ShowListEntry
								{show}
								isActiveOnRemoteServer={activeRemoteShowId === show.id && !$remoteServerStatusStore?.isEnded}
								onOpenRemoteStage={openRemoteStage}
							/>
							{#if index === 0 && activeRemoteShowId === show.id && !$remoteServerStatusStore?.isEnded}
								<div class="show-spacer"></div>
							{/if}
						{/each}

						<!-- Private shows section - only visible to authenticated users -->
						{#if $isTheaterAuthenticated}
							<h6 class="title is-6 has-text-grey previous-shows-title mt-6 mb-4">Gömda föreställningar - syns endast för dig som inloggad</h6>
							{#each hiddenShows as show (show.id)}
								<ShowListEntry
									{show}
									isActiveOnRemoteServer={activeRemoteShowId === show.id && !$remoteServerStatusStore?.isEnded}
									onOpenRemoteStage={openRemoteStage}
								/>
							{/each}
						{/if}

						<!-- Empty state -->
						{#if $showsListStore.length === 0 || (!$isTheaterAuthenticated && publicShows.length === 0)}
							<div class="m-6 has-text-centered">
								<p class="has-text-grey">Det finns inga föreställningar att visa just nu.</p>
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

	.private-shows-divider {
		margin: 2rem 0 1rem 0;
		border: none;
		border-top: 1px solid var(--bulma-scheme-main-bis);
	}

	.private-shows-title {
		margin-bottom: 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		opacity: 0.7;
	}

	.show-spacer {
		height: 40px;
	}
</style>
