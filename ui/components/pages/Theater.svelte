<script lang="ts">
	import { onMount } from "svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "~/components/theater/TheaterActionBar.svelte";

	import AuthenticationModal from "~/components/modals/TheaterAuthenticationModal.svelte";
	import AboutModal from "~/components/modals/TheaterAboutModal.svelte";
	import CreateStageModal from "~/components/modals/TheaterCreateStageModal.svelte";
	import { stagesLoadingStore, stagesErrorStore, fetchStages, initializeStageAPI } from "~/api/stage";
	import { showAuthModal, showAboutModal, showCreateStageModal, closeAuthModal, closeAboutModal, closeCreateStageModal } from "~/stores/theaterModals";
	import StagesList from "../theater/StagesList.svelte";

	onMount(async () => {
		// Initialize the stage API and fetch stages
		await initializeStageAPI();
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

	function handleStageCreated(event: CustomEvent<{ id: number; name: string }>) {
		closeCreateStageModal();
		console.log(`Stage created: ${event.detail.name} (ID: ${event.detail.id})`);
		// Refresh the stages list
		fetchStages();
	}

	function handleCreateStageCancel() {
		closeCreateStageModal();
	}

	// Use reactive statement to get stages from store
	$: isLoadingStages = $stagesLoadingStore;
	$: stagesError = $stagesErrorStore;
</script>

<main>
	<!-- Header -->
	<TheaterHeader />

	<!-- Main content area with columns -->
	<section class="section theater-content">
		<div class="column-background left-column"></div>
		<div class="column-background right-column"></div>

		<div class="container is-fluid">
			<div class="container content-container">
				<!-- Action Bar Controls -->
				<TheaterActionBar />

				<!-- Stages list section -->
				{#if isLoadingStages}
					<div class="box">
						<div class="has-text-centered">
							<div class="is-loading"></div>
							<p class="is-family-secondary">Hämtar scener & servrar...</p>
						</div>
					</div>
				{:else if stagesError}
					<div class="box">
						<div class="notification is-danger is-light">
							<p class="is-family-secondary">ojdå: {stagesError}</p>
							<button class="button is-small is-danger is-outlined mt-2" on:click={fetchStages}> Försök igen </button>
						</div>
					</div>
				{:else}
					<!-- Stages content would go here -->
					<StagesList></StagesList>
				{/if}
			</div>
		</div>
	</section>

	<!-- Modals managed centrally -->
	<AuthenticationModal isVisible={$showAuthModal} on:authenticated={handleAuthenticated} on:cancel={handleAuthCancel} />

	<AboutModal isVisible={$showAboutModal} on:close={handleAboutClose} />

	<CreateStageModal isVisible={$showCreateStageModal} on:created={handleStageCreated} on:cancel={handleCreateStageCancel} />
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
