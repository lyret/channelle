<script lang="ts">
	import { blur } from "svelte/transition";

	import { showMetadataStore, configurationIsLoading, configurationError } from "~/api/backstage/backstageClient";

	import TheaterWrapper from "~/components/theater/_TheaterWrapper.svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "~/components/theater/TheaterActionBar.svelte";
	import ConfigurationInstruments from "~/components/instruments/ConfigurationInstruments.svelte";
	import IconArrowLeft from "~/components/picol/icons/Picol-arrow-full-left.svelte";

	// Use reactive statements to get show data from store
	$: currentShow = $showMetadataStore;
	$: showName = currentShow?.name || "Okänd föreställning";
</script>

<TheaterWrapper>
	<div in:blur={{ delay: 500, duration: 1000 }}>
		<TheaterHeader minimal={true} />
		<TheaterActionBar>
			<a slot="right" class="button is-small is-inverted" href="/">
				<span class="icon is-size-4">
					<IconArrowLeft />
				</span>
				<span class="is-family-secondary">Alla föreställningar</span>
			</a>
		</TheaterActionBar>

		<div class="has-text-centered mt-2 mb-4" in:blur={{ duration: 500, delay: 1000 }}>
			{#if $configurationError}
				<p class="subtitle is-4 has-text-danger has-text-weight-semibold mt-6">{$configurationError}</p>
			{:else if currentShow}
				<p class="subtitle is-4 has-text-white">
					Förbereder "{showName}" innan lansering {#if $configurationIsLoading}
						<span class="is-loading"></span>
					{/if}
				</p>
			{/if}
		</div>

		{#if $configurationError}
			<div class="has-text-centered" style="margin-top: 1rem;">
				<a href="/" class="button is-danger">Tillbaka till teatern</a>
			</div>
		{:else if currentShow}
			<ConfigurationInstruments showParticipants={true} showMediaLibrary={false} />
		{/if}
	</div>
</TheaterWrapper>
