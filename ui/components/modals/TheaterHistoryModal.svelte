<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";
	import HistoryListEntry from "~/components/HistoryListEntry.svelte";
	import IconRefresh from "~/components/picol/icons/Picol-refresh.svelte";
	import { historyStore, historyStoreIsLoading, historyErrorStore, fetchHistory } from "~/api/history";
	import { isTheaterAuthenticated } from "~/api/auth";

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let isVisible = false;

	function handleClose() {
		dispatch("close");
	}

	async function refreshHistory() {
		if ($isTheaterAuthenticated) {
			await fetchHistory();
		}
	}
</script>

<Modal {isVisible} title="Föreställningshistorik" size="large" on:close={handleClose}>
	<div class="content">
		{#if !$isTheaterAuthenticated}
			<p class="has-text-centered">Du måste vara inloggad för att se föreställningshistorik.</p>
		{:else if $historyStoreIsLoading}
			<div class="has-text-centered">
				<div class="is-loading"></div>
				<p class="is-family-secondary">Laddar historik...</p>
			</div>
		{:else if $historyErrorStore}
			<div class="notification is-danger">
				<p class="is-family-secondary has-text-white">Ett fel uppstod: {$historyErrorStore}</p>
				<button class="button is-small is-light is-outlined mt-2" on:click={refreshHistory}>Försök igen</button>
			</div>
		{:else if $historyStore.length === 0}
			<p class="has-text-centered has-text-grey">Ingen föreställningshistorik tillgänglig.</p>
		{:else}
			<div class="history-list">
				{#each $historyStore as history (history.id)}
					<HistoryListEntry {history} />
				{/each}
			</div>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<button class="button" on:click={handleClose}>Stäng</button>
	</svelte:fragment>
</Modal>

<style lang="scss">
	.content {
		color: var(--bulma-scheme-invert);

		p {
			margin-bottom: 1rem;
		}

		.has-text-grey {
			color: var(--bulma-scheme-invert) !important;
			opacity: 0.7;
		}
	}

	.history-list {
		max-height: 60vh;
		overflow-y: auto;
		padding-right: 1rem;
	}

	.history-list::-webkit-scrollbar {
		width: 8px;
	}

	.history-list::-webkit-scrollbar-track {
		background: var(--bulma-scheme-main-bis);
		border-radius: 4px;
	}

	.history-list::-webkit-scrollbar-thumb {
		background: var(--bulma-scheme-main);
		border-radius: 4px;
	}

	.history-list::-webkit-scrollbar-thumb:hover {
		background: var(--bulma-scheme-main);
	}
</style>
