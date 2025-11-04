<script lang="ts">
	import { onMount } from "svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "~/components/theater/TheaterActionBar.svelte";

	import AuthenticationModal from "~/components/modals/TheaterAuthenticationModal.svelte";
	import AboutModal from "~/components/modals/TheaterAboutModal.svelte";
	import CreateShowModal from "~/components/modals/TheaterCreateShowModal.svelte";
	import { showsLoadingStore, showsErrorStore, fetchShows, initializeConfigAPI } from "~/api/config";
	import { showAuthModal, showAboutModal, showCreateShowModal, closeAuthModal, closeAboutModal, closeCreateShowModal } from "~/stores/theaterModals";
	import ShowsList from "../theater/ShowsList.svelte";

	onMount(async () => {
		// Initialize the show API and fetch shows
		await initializeConfigAPI();
	});

	// Modal event handlers
	function handleAuthenticated() {
		closeAuthModal();
	}

	function handleAuthCancel() {
		closeAuthModal();
	}

	function handleAboutClose() {
		closeAboutModal();
	}

	function handleShowCreated(event: CustomEvent<{ id: number; name: string }>) {
		closeCreateShowModal();
		console.log(`Show created: ${event.detail.name} (ID: ${event.detail.id})`);
		// Refresh the shows list
		fetchShows();
	}

	function handleCreateShowCancel() {
		closeCreateShowModal();
	}

	// Use reactive statement to get shows from store
	$: isLoadingShows = $showsLoadingStore;
	$: showsError = $showsErrorStore;
</script>

<main>
	<!-- Header -->
	<TheaterHeader />
	<h2 class="subtitle theater-title has-text-centered">Välkommen till vår kvartersteater</h2>

	<!-- Main content area with columns -->
	<section class="section theater-content">
		<div class="column-background left-column"></div>
		<div class="column-background right-column"></div>

		<div class="container is-fluid">
			<div class="container content-container">
				<!-- Action Bar Controls -->
				<TheaterActionBar />

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
						<div class="notification is-danger is-light">
							<p class="is-family-secondary">ojdå: {showsError}</p>
							<button class="button is-small is-danger is-outlined mt-2" on:click={fetchShows}> Försök igen </button>
						</div>
					</div>
				{:else}
					<!-- Shows content would go here -->
					<ShowsList></ShowsList>
				{/if}
			</div>
		</div>
	</section>

	<!-- Modals managed centrally -->
	<AuthenticationModal isVisible={$showAuthModal} on:authenticated={handleAuthenticated} on:cancel={handleAuthCancel} />

	<AboutModal isVisible={$showAboutModal} on:close={handleAboutClose} />

	<CreateShowModal isVisible={$showCreateShowModal} on:created={handleShowCreated} on:cancel={handleCreateShowCancel} />
</main>

<style lang="scss">
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.section {
		flex: 1;
		position: relative;
	}

	.theater-content {
		position: relative;
		overflow-x: hidden;
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
</style>
