<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";
	import {
		remoteServerStatusStore,
		updateRemoteServerStatus,
		remoteServerStatusError,
		remoteServerStatusIsLoading,
		endCurrentShowOnRemoteServer,
		startShowOnRemoteServer,
	} from "~/api/theater";
	import { showsListStore } from "~/api/shows";
	import IconAlertCircle from "~/components/icons/Icon-alert-circle.svelte";
	import IconCheck from "~/components//icons/Icon-check.svelte";
	import IconLoader from "~/components//icons/Icon-loader.svelte";
	import IconPlay from "~/components//icons/Icon-play.svelte";
	import IconStop from "~/components//icons/Icon-stop-circle.svelte";
	import IconRefresh from "~/components//icons/Icon-refresh-cw.svelte";

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

	// Remote server status and handlers
	//
	onMount(() => {
		updateRemoteServerStatus();
	});

	async function handleUpdateStatus() {
		await updateRemoteServerStatus();
	}

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

<Modal {isVisible} title="Serverhantering" on:close={handleCloseModal}>
	<div class="box mb-4">
		<h4 class="title is-4">Server Status</h4>

		{#if !$remoteServerStatusStore?.isEnded}
			<div class="notification is-success">
				<span class="icon mr-2">
					<IconCheck />
				</span>
				<strong>Servern är aktiv med {$remoteServerStatusStore?.backstageConfiguration.name || "?"}</strong>
			</div>
		{:else}
			<div class="notification is-warning">
				<span class="icon mr-2">
					<IconAlertCircle />
				</span>
				<strong>Servern är inte aktiv</strong>
			</div>
		{/if}
	</div>

	<!-- Show Selection -->
	<div class="box mb-4">
		<h4 class="title is-4">Välj show</h4>

		<div class="select is-fullwidth">
			<select bind:value={selectedShowId} disabled={isLoading}>
				<option value="">Välj en show...</option>
				{#each shows as show}
					<option value={show.id}>{show.name}</option>
				{/each}
			</select>
		</div>

		{#if selectedShowId}
			<p class="mt-2">Selected: {selectedShow?.name}</p>
		{/if}
	</div>

	<!-- Action Buttons -->
	<div class="box">
		<h4 class="title is-4">Actions</h4>

		<div class="buttons">
			<button class="button is-primary" on:click={handleStartShow} disabled={isLoading || !selectedShowId}>
				<span class="icon">
					<IconPlay />
				</span>
				<span
					>{$remoteServerStatusStore?.backstageConfiguration.showId === selectedShowId ? "Starta om" : "Starta"}
					{selectedShow?.nomenclature || "föreställningen"}</span
				>
			</button>

			<button class="button is-danger" on:click={handleEndShow} disabled={isLoading}>
				<span class="icon">
					<IconStop />
				</span>
				<span>Avsluta server</span>
			</button>

			<button class="button is-info" on:click={handleUpdateStatus} disabled={isLoading}>
				<span class="icon">
					<IconRefresh />
				</span>
				<span>Uppdatera Status</span>
			</button>
		</div>

		<!-- Status Indicators -->
		{#if isLoading}
			<div class="notification is-info">
				<span class="icon mr-2">
					<IconLoader />
				</span>
				Vänta...
			</div>
		{/if}

		{#if errorMessage}
			<div class="notification is-danger mt-2">
				<span class="icon mr-2">
					<IconAlertCircle />
				</span>
				{errorMessage}
			</div>
		{/if}
	</div>
</Modal>

<style lang="scss">
	.help {
		margin-top: 0.5rem;
	}
</style>
