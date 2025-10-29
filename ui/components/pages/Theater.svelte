<script lang="ts">
	import { onMount } from "svelte";
	import TheaterHeader from "~/components/theater/TheaterHeader.svelte";
	import TheaterActionBar from "~/components/theater/TheaterActionBar.svelte";
	import StagesList from "~/components/theater/StagesList.svelte";
	import { stagesStore, stagesLoadingStore, stagesErrorStore, fetchStages, createStage, initializeStageAPI } from "~/api/stage";
	import type { CreateStageData } from "~/shared";

	let isSignedIn = false;
	let showCreateStageModal = false;
	let newStageName = "";
	let newStageDescription = "";
	let newStagePassword = "";

	onMount(async () => {
		// Initialize the stage API and fetch stages
		await initializeStageAPI();
	});

	// Use reactive statement to get stages from store
	$: stages = $stagesStore;
	$: isLoadingStages = $stagesLoadingStore;
	$: stagesError = $stagesErrorStore;
</script>

<main>
	<!-- Header -->
	<TheaterHeader />

	<!-- Main content area with columns -->
	<section class="section">
		<div class="container is-fluid">
					<div class="container">

						<!-- Action Bar Controls -->
						<TheaterActionBar />

						<!-- Stages list section -->
						{#if isLoadingStages}
							<div class="box">
								<div class="has-text-centered">
									<div class="is-loading"></div>
									<p class="is-family-secondary">Loading stages...</p>
								</div>
							</div>
						{:else if stagesError}
							<div class="box">
								<div class="notification is-danger is-light">
									<p class="is-family-secondary">Error: {stagesError}</p>
									<button class="button is-small is-danger is-outlined mt-2" on:click={fetchStages}>
										Retry
									</button>
								</div>
							</div>
						{:else}
						{/if}
					</div>
				</div>
	</section>

	<!-- Create Stage Modal -->
	{#if showCreateStageModal}
		<div class="modal is-active">
			<div class="modal-background" on:click={cancelCreateStage}></div>
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title is-family-title">Create New Stage</p>
					<button class="delete" aria-label="close" on:click={cancelCreateStage}></button>
				</header>
				<section class="modal-card-body">
					<div class="field">
						<label class="label is-family-secondary">Stage Name</label>
						<div class="control">
							<input
								class="input"
								type="text"
								placeholder="Enter stage name"
								bind:value={newStageName}
								required
							/>
						</div>
					</div>

					<div class="field">
						<label class="label is-family-secondary">Description</label>
						<div class="control">
							<textarea
								class="textarea"
								placeholder="Enter stage description (optional)"
								bind:value={newStageDescription}
							></textarea>
						</div>
					</div>

					<div class="field">
						<label class="label is-family-secondary">Stage Password</label>
						<div class="control">
							<input
								class="input"
								type="password"
								placeholder="Enter password (optional)"
								bind:value={newStagePassword}
							/>
						</div>
						<p class="help">Leave empty for a public stage</p>
					</div>
				</section>
				<footer class="modal-card-foot">
					<button class="button is-primary is-family-secondary" on:click={submitCreateStage}>
						Create Stage
					</button>
					<button class="button is-family-secondary" on:click={cancelCreateStage}>
						Cancel
					</button>
				</footer>
			</div>
		</div>
	{/if}
</main>

<style lang="scss">
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.section {
		flex: 1;
	}

	.columns.is-fullheight {
		min-height: calc(100vh - 200px);
	}

	// Responsive adjustments
	@include mobile {
		.columns {
			display: block;
		}

		.column.is-8 {
			width: 100%;
		}
	}
</style>
