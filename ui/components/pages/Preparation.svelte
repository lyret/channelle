<script lang="ts">
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";

	import { showMetadataStore, selectShow, initializeConfigAPI, getShow, currentShowIsLoading, currentShowError } from "~/api/shows";

	import TheaterWrapper from "~/components/theater/_TheaterWrapper.svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "~/components/theater/TheaterActionBar.svelte";
	import ConfigurationInstruments from "~/components/instruments/ConfigurationInstruments.svelte";
	import IconArrowLeft from "~/components/picol/icons/Picol-arrow-full-left.svelte";

	// Use reactive statements to get show data from store
	$: currentShow = $showMetadataStore;
	$: showName = currentShow?.name || "Okänd föreställning";
	$: isShowAlreadyPerformed = currentShow?.lastOnlineAt !== null;

	onMount(async () => {
		// Get show ID from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const showIdParam = urlParams.get("show");

		let showId: number | null = null;

		if (showIdParam) {
			const showIdNum = parseInt(showIdParam, 10);
			if (!isNaN(showIdNum)) {
				showId = showIdNum;
				// Store show ID in session storage for persistence
				sessionStorage.setItem("currentShowId", showIdNum.toString());
			} else {
				currentShowError.set("Invalid show ID format");
				return;
			}
		} else {
			// Check if we have a show ID in session storage
			const storedShowId = sessionStorage.getItem("currentShowId");
			if (storedShowId) {
				const showIdNum = parseInt(storedShowId, 10);
				if (!isNaN(showIdNum)) {
					showId = showIdNum;
				} else {
					currentShowError.set("Invalid stored show ID format");
					return;
				}
			} else {
				currentShowError.set("No show ID specified in URL");
				return;
			}
		}

		if (showId) {
			try {
				// Verify the show exists
				const showData = await getShow(showId);
				if (!showData) {
					currentShowError.set(`Show with ID ${showId} not found`);
					return;
				}

				// Select the show in the config system (this will update showMetadataStore)
				const success = await selectShow(showId, true);
				if (!success) {
					// selectShow already sets error in store
					return;
				}

				// Initialize the config API after selecting the show
				await initializeConfigAPI();
			} catch (err) {
				currentShowError.set(err instanceof Error ? err.message : "Failed to load show data");
				console.error("Error loading show:", err);
			}
		}
	});
</script>

<TheaterWrapper>
	<div in:blur={{ delay: 500, duration: 1000 }}>
		<!-- Header with Action Bar -->
		<TheaterHeader withoutSubtitle={true} />
		<TheaterActionBar>
			<a slot="right" class="button is-small is-inverted" href="/">
				<span class="icon is-size-4">
					<IconArrowLeft />
				</span>
				<span class="is-family-secondary">Alla föreställningar</span>
			</a>
		</TheaterActionBar>

		<div class="has-text-centered mt-2 mb-4" in:blur={{ duration: 500, delay: 1000 }}>
			{#if $currentShowIsLoading}
				<p class="subtitle is-4 has-text-grey">Laddar showdata...</p>
			{:else if $currentShowError}
				<p class="subtitle is-4 has-text-danger has-text-weight-semibold mt-6">{$currentShowError}</p>
			{:else if currentShow && isShowAlreadyPerformed}
				<p class="subtitle is-4 has-text-warning has-text-weight-semibold">
					"{showName}" har redan visats och kan inte längre redigeras här
				</p>
				<p class="is-size-6 mb-2">Du kan fortfarande se inställningarna nedan, men ändringar kommer inte att sparas.</p>
			{:else if currentShow}
				<p class="subtitle is-4 has-text-white">Förbereder "{showName}" innan lansering</p>
			{:else}
				<p class="subtitle is-4 has-text-white">Förbereder innan lansering</p>
			{/if}
		</div>

		{#if $currentShowIsLoading}
			<div class="has-text-centered" style="margin-top: 2rem;">
				<div class="is-loading"></div>
			</div>
		{:else if $currentShowError}
			<div class="has-text-centered" style="margin-top: 1rem;">
				<a href="/" class="button is-danger">Tillbaka till teatern</a>
			</div>
		{:else if currentShow}
			<ConfigurationInstruments showParticipants={false} showMediaLibrary={false} />
		{/if}
	</div>
</TheaterWrapper>
