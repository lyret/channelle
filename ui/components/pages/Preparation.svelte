<script lang="ts">
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";

	import { getShow, currentShowStore, selectShow } from "~/api/config";
	import { initializeConfigManager } from "~/api/config";
	import type { PublicShowData } from "~/types/serverSideTypes";

	// Type alias for client-side data (dates serialized as strings)
	type PublicShowDataResponse = Omit<PublicShowData, "createdAt" | "updatedAt"> & {
		createdAt: string;
		updatedAt: string;
	};

	import TheaterWrapper from "~/components/theater/_TheaterWrapper.svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "~/components/theater/TheaterActionBar.svelte";
	import InstrumentContainer from "~/components/instruments/_InstrumentContainer.svelte";
	import IconArrowLeft from "~/components/picol/icons/Picol-arrow-full-left.svelte";

	let currentShow: PublicShowDataResponse | null = null;
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		// Get show ID from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const showId = urlParams.get("show");

		if (showId) {
			try {
				const showIdNum = parseInt(showId, 10);
				if (!isNaN(showIdNum)) {
					// Store show ID in session storage for persistence
					sessionStorage.setItem("currentShowId", showIdNum.toString());

					currentShow = await getShow(showIdNum);
					if (!currentShow) {
						error = `Show with ID ${showIdNum} not found`;
					} else {
						// Select the show in the config system
						await selectShow(showIdNum, true);
					}
				} else {
					error = "Invalid show ID format";
				}
			} catch (err) {
				error = err instanceof Error ? err.message : "Failed to load show data";
				console.error("Error loading show:", err);
			}
		} else {
			// Check if we have a show ID in session storage
			const storedShowId = sessionStorage.getItem("currentShowId");
			if (storedShowId) {
				try {
					const showIdNum = parseInt(storedShowId, 10);
					if (!isNaN(showIdNum)) {
						currentShow = await getShow(showIdNum);
						if (!currentShow) {
							error = `Show with ID ${showIdNum} not found`;
						} else {
							// Select the show in the config system
							await selectShow(showIdNum, true);
						}
					} else {
						error = "Invalid stored show ID format";
					}
				} catch (err) {
					error = err instanceof Error ? err.message : "Failed to load stored show data";
					console.error("Error loading stored show:", err);
				}
			} else {
				error = "No show ID specified in URL";
			}
		}

		// Initialize the config manager after loading show data
		await initializeConfigManager();

		loading = false;
	});
</script>

<TheaterWrapper>
	<div in:blur={{ delay: 500, duration: 1000 }}>
		<!-- Header with Action Bar -->
		<TheaterHeader />
		<TheaterActionBar>
			<a slot="right" class="button is-small is-inverted" href="/">
				<span class="icon is-size-4">
					<IconArrowLeft />
				</span>
				<span class="is-family-secondary">Alla föreställningar</span>
			</a>
		</TheaterActionBar>

		<div class="has-text-centered mb-4" in:blur={{ duration: 500, delay: 1000 }}>
			{#if loading}
				<p class="subtitle is-4 has-text-grey">Laddar showdata...</p>
			{:else if error}
				<p class="subtitle is-4 has-text-danger">{error}</p>
			{:else if currentShow}
				<p class="subtitle is-4 has-text-white">Förbereder "{$currentShowStore?.name || currentShow.name}" innan lansering</p>
			{:else}
				<p class="subtitle is-4 has-text-white">Förbereder innan lansering</p>
			{/if}
		</div>

		{#if loading}
			<div class="has-text-centered" style="margin-top: 2rem;">
				<div class="is-loading"></div>
			</div>
		{:else if error}
			<div class="notification is-danger is-light" style="margin: 2rem;">
				<p class="has-text-centered">{error}</p>
				<div class="has-text-centered" style="margin-top: 1rem;">
					<a href="/theater" class="button is-secondary">Tillbaka till teatern</a>
				</div>
			</div>
		{:else if currentShow}
			<InstrumentContainer showParticipants={false} showMediaLibrary={false} />
		{/if}
	</div>
</TheaterWrapper>

<style>
	:global(main) {
		height: 100%;
	}

	.instruments,
	.instrument {
		background-color: var(--channelle-backstage-bg-color);
	}
	.instrument-cols-0 {
		background-color: var(--channelle-main-bg-color);
		height: 0;
		flex-grow: 0;
	}

	li a {
		color: var(--channelle-main-text-color);
	}
	li:hover a,
	li.is-active a {
		border-color: var(--channelle-backstage-text-color);
		color: var(--channelle-backstage-text-color);
		background-color: var(--channelle-backstage-bg-color);
	}
	.tabs ul {
		border-color: var(--channelle-backstage-text-color);
		border-bottom: none;
	}

	.header,
	.tabs {
		background-color: var(--channelle-main-bg-color);
		padding: 0;
		display: block;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;
	}

	.tabs {
		z-index: 10;
	}

	.instruments {
		flex-grow: 1;
		display: flex;
		flex-direction: row;
		overflow: hidden;
	}

	.instrument-cols-1 {
		margin-left: 20%;
		margin-right: 20%;
	}
	.instrument-cols-2 {
		margin-left: 10%;
		margin-right: 10%;
	}
	.instrument-cols-3 {
		margin-left: 5%;
		margin-right: 5%;
	}

	.instrument {
		flex: 1;
		margin: 10px;
		padding: 10px;
		padding-top: 20px;
		padding-bottom: 20px;
		overflow-y: auto;
	}
</style>
