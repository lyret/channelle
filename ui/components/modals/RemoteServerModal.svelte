<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";
	import {
		remoteServerStatusStore,
		remoteServerStatusError,
		remoteServerStatusIsLoading,
		endCurrentShowOnRemoteServer,
		startShowOnRemoteServer,
	} from "~/api/theater";
	import { showsListStore } from "~/api/shows";
	import IconPlay from "~/components/icons/Icon-play.svelte";
	import IconStop from "~/components/icons/Icon-stop-circle.svelte";

	// Modal controls
	export let isVisible = false;
	const dispatch = createEventDispatcher();

	// UI Status elements
	$: isLoading = $remoteServerStatusIsLoading;
	$: errorMessage = $remoteServerStatusError;
	$: console.log($remoteServerStatusStore);

	// Show selection
	let selectedShowId: number | null = null;
	$: shows = $showsListStore;
	$: selectedShow = selectedShowId ? $showsListStore.find((s) => s.id == selectedShowId) : null;

	async function handleEndShow() {
		await endCurrentShowOnRemoteServer();
	}

	async function handleStartShow() {
		if (!selectedShowId) {
			remoteServerStatusError.set("Please select a show first");
			return;
		}

		await startShowOnRemoteServer(selectedShowId);
	}

	function handleCloseModal() {
		dispatch("close");
	}
</script>

<Modal {isVisible} title="Hantera scenen" on:close={handleCloseModal}>
	<h4 class="subtitle is-5 mt-3">Nuvarande visning</h4>
	{#if errorMessage}
		<div class="notification is-danger">
			<p class="is-family-secondary has-text-white">Ett fel uppstod: {errorMessage}</p>
		</div>
	{:else if isLoading}
		<div class="notification p-0 m-0 is-warning">Vänta...</div>
	{:else if !$remoteServerStatusStore?.isEnded}
		<div class="notification p-0 m-0 is-success">Visning pågår</div>
		{#if $remoteServerStatusStore?.backstageConfiguration}
			<div class="mt-2 is-size-7">
				Föreställning: {$remoteServerStatusStore.backstageConfiguration.name}<br />
				Offentlig: {$remoteServerStatusStore.backstageConfiguration.isPublic ? "Ja" : "Nej"}<br />
				Lösenord: {$remoteServerStatusStore.backstageConfiguration.password}<br />
				Ridån: {$remoteServerStatusStore.backstageConfiguration.curtainsOverride ? "Nere" : "Uppe"}<br />
			</div>
		{/if}
		{#if $remoteServerStatusStore?.createdAt}
			<div class="mt-2 is-size-7">
				Startad: {new Date($remoteServerStatusStore.createdAt).toLocaleString()}
			</div>
		{/if}
	{:else}
		<div class="notification p-0 m-0 is-warning">Ingen visning pågår</div>
	{/if}

	<!-- Show Selection -->
	<h4 class="subtitle is-5 mt-6">Välj en föreställning att visa</h4>

	<div class="select is-fullwidth">
		<select bind:value={selectedShowId} disabled={isLoading} placeholder="Välj en...">
			<option value={""}></option>
			{#each shows as show}
				<option value={show.id}>{show.name}</option>
			{/each}
		</select>
	</div>
	<button class="button is-primary is-fullwidth mt-1" on:click={handleStartShow} disabled={isLoading || !selectedShowId || !!errorMessage}>
		<span class="icon">
			<IconPlay />
		</span>
		<span
			>{$remoteServerStatusStore?.backstageConfiguration.showId === selectedShowId ? "Starta om" : "Starta"}
			{selectedShow?.nomenclature || "föreställningen"}
			{$remoteServerStatusStore?.backstageConfiguration.showId === selectedShowId && !$remoteServerStatusStore?.isEnded ? "" : "istället"}</span
		>
	</button>

	<button class="button is-danger is-fullwidth mt-1" on:click={handleEndShow} disabled={isLoading || $remoteServerStatusStore?.isEnded || !!errorMessage}>
		<span class="icon">
			<IconStop />
		</span>
		<span>Avsluta pågående visning</span>
	</button>

	<svelte:fragment slot="footer"></svelte:fragment>
</Modal>
