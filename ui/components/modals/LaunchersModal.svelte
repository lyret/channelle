<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import Modal from "./_Modal.svelte";
	import {
		launcherReadyStore,
		adapterStatusStore,
		instancesStore,
		runningInstancesCountStore,
		launcherErrorStore,
		startLauncherSync,
		stopAllInstances,
		stopInstance,
		launchShow,
		getLaunchableShows,
	} from "~/api/launchers";
	import { isTheaterAuthenticated } from "~/api/auth";

	import IconStop from "~/components/picol/icons/Picol-controls-stop.svelte";
	import IconRefresh from "~/components/picol/icons/Picol-refresh.svelte";
	import IconPlay from "~/components/picol/icons/Picol-controls-play.svelte";
	import InstanceCard from "./InstanceCard.svelte";

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let isVisible = false;

	let syncCleanup: (() => void) | null = null;
	let isStoppingAll = false;
	let stoppingInstances = new Set<string>();
	let isLaunching = false;
	let availableShows: { id: number; name: string }[] = [];
	let selectedShowId: number | null = null;
	let launchError: string | null = null;
	let isLoadingShows = false;

	function handleClose() {
		dispatch("close");
	}

	onMount(() => {
		if (isVisible) {
			syncCleanup = startLauncherSync(3000);
		}
	});

	onDestroy(() => {
		if (syncCleanup) {
			syncCleanup();
		}
	});

	// Start/stop sync based on visibility
	$: if (isVisible && !syncCleanup) {
		syncCleanup = startLauncherSync(3000);
		loadAvailableShows();
	} else if (!isVisible && syncCleanup) {
		syncCleanup();
		syncCleanup = null;
	}

	async function handleStopAll() {
		if (!$isTheaterAuthenticated || isStoppingAll) return;

		isStoppingAll = true;
		try {
			const result = await stopAllInstances();
			if (result.success) {
				console.log(`Stopped ${result.stoppedCount} instances`);
			}
		} finally {
			isStoppingAll = false;
		}
	}

	async function handleStopInstance(instanceId: string) {
		if (!$isTheaterAuthenticated || stoppingInstances.has(instanceId)) return;

		stoppingInstances.add(instanceId);
		stoppingInstances = stoppingInstances; // Trigger reactivity

		try {
			const result = await stopInstance(instanceId);
			if (result.success) {
				console.log(`Stopped instance ${instanceId}`);
			}
		} finally {
			stoppingInstances.delete(instanceId);
			stoppingInstances = stoppingInstances; // Trigger reactivity
		}
	}

	async function loadAvailableShows() {
		if (!isLoadingShows && $isTheaterAuthenticated) {
			isLoadingShows = true;
			launchError = null;
			try {
				const shows = await getLaunchableShows();
				availableShows = shows.map((show) => ({ id: show.id, name: show.name }));
				if (availableShows.length > 0 && selectedShowId === null) {
					selectedShowId = availableShows[0].id;
				}
			} catch (error) {
				console.error("Failed to load shows:", error);
				launchError = "Kunde inte ladda föreställningar";
			} finally {
				isLoadingShows = false;
			}
		}
	}

	async function handleLaunchShow() {
		if (!$isTheaterAuthenticated || isLaunching || !selectedShowId || !canLaunch) return;

		isLaunching = true;
		launchError = null;

		try {
			const result = await launchShow(selectedShowId);
			if (result.success) {
				console.log(`Launched show ${selectedShowId}: ${result.message}`);
				// Refresh the instances list
				if (syncCleanup) {
					syncCleanup();
				}
				syncCleanup = startLauncherSync(3000);
			} else {
				launchError = result.message || "Misslyckades med att starta föreställning";
			}
		} catch (error: any) {
			console.error("Failed to launch show:", error);
			launchError = error.message || "Ett fel uppstod vid start av föreställning";
		} finally {
			isLaunching = false;
		}
	}

	function handleRefresh() {
		if (syncCleanup) {
			syncCleanup();
		}
		syncCleanup = startLauncherSync(3000);
	}

	// Swedish adapter names mapping
	const adapterNames = {
		none: " - Ingen - ",
		remote: "statisk lokaldrift",
		local: "dynamisk lokaldrift",
		digitalocean: "dynamisk virtuella servrar",
	};

	// Helper function to get Swedish adapter name
	function getAdapterDisplayName(adapterName: string | null): string {
		if (!adapterName) return "Okänd";
		return adapterNames[adapterName as keyof typeof adapterNames] || adapterName;
	}

	// Reactive statements for display
	$: isReady = $launcherReadyStore;
	$: adapterStatus = $adapterStatusStore;
	$: instances = $instancesStore;
	$: runningCount = $runningInstancesCountStore;
	$: error = $launcherErrorStore;
	$: canLaunch = adapterStatus?.canLaunch === true;
</script>

<Modal {isVisible} title="Serverhantering" size="large" on:close={handleClose}>
	<div class="launcher-modal-content">
		<!-- Status Overview -->
		<div class="status-header">
			<div class="level">
				<div class="level-left">
					<div class="level-item">
						<div class="ml-3">
							<div class="status-info">
								{#if activeAdapter}
									<span class="adapter-name has-text-weight-semibold">
										Hanterar servrar via {getAdapterDisplayName(activeAdapter)}
									</span>
								{/if}
								<span
									class="tag launcher-status-tag"
									class:is-success={isReady && canLaunch}
									class:is-warning={isReady && !canLaunch}
									class:is-danger={!isReady}
								>
									{#if !isReady}
										Ingen möjlighet
									{:else if canLaunch}
										OK
									{:else}
										Begränsad möjlighet
									{/if}
								</span>
							</div>
							{#if runningCount > 0}
								<p class="is-size-7 has-text-grey">
									<strong>{runningCount}</strong> running instance{runningCount !== 1 ? "s" : ""}
								</p>
							{/if}
						</div>
					</div>
				</div>
				<div class="level-right">
					<div class="level-item">
						<div class="buttons">
							<button class="button is-small is-outlined" on:click={handleRefresh} title="Refresh launcher status">
								<span class="icon is-small">
									<IconRefresh />
								</span>
								<span>Uppdatera</span>
							</button>
							{#if $isTheaterAuthenticated && runningCount > 0}
								<br />
								<button
									class="button is-small is-danger is-outlined"
									class:is-loading={isStoppingAll}
									disabled={isStoppingAll}
									on:click={handleStopAll}
									title="Stop all running instances"
								>
									<span class="icon is-small">
										<IconStop />
									</span>
									<span>Stoppa alla</span>
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Launch Form -->
		{#if $isTheaterAuthenticated}
			<div class="launch-form-section">
				<h6 class="title is-6 mb-3">Starta ny föreställning</h6>
				<div class="field is-horizontal">
					<div class="field-body">
						<div class="field is-expanded">
							<div class="control is-expanded">
								<div class="select is-fullwidth">
									<select bind:value={selectedShowId} disabled={isLoadingShows || isLaunching || !canLaunch}>
										{#if isLoadingShows}
											<option value="">Laddar föreställningar...</option>
										{:else if availableShows.length === 0}
											<option value="">Inga föreställningar tillgängliga</option>
										{:else}
											{#each availableShows as show (show.id)}
												<option value={show.id}>{show.name}</option>
											{/each}
										{/if}
									</select>
								</div>
							</div>
						</div>
						<div class="field">
							<div class="control">
								<button
									class="button is-success"
									class:is-loading={isLaunching}
									disabled={isLoadingShows || isLaunching || !selectedShowId || !canLaunch}
									on:click={handleLaunchShow}
									title="Starta vald föreställning"
								>
									<span class="icon is-small">
										<IconPlay />
									</span>
									<span>Starta</span>
								</button>
							</div>
						</div>
					</div>
					{#if launchError}
						<div class="notification is-danger is-light mt-3">
							<p class="is-size-7">{launchError}</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Status Details -->
		{#if adapterStatus?.reason && !canLaunch}
			<div class="notification is-warning is-light">
				<p class="is-size-7">
					<strong>Begränsning:</strong>
					{adapterStatus.reason}
				</p>
			</div>
		{/if}

		{#if error}
			<div class="notification is-danger">
				<p class="is-size-7">
					<strong>Tekniskt fel:</strong>
					{error}
				</p>
			</div>
		{/if}

		<!-- Launches List -->
		{#if $isTheaterAuthenticated && instances.length > 0}
			<div class="instances-section">
				<h6 class="title is-6 mb-3">Aktiva servrar</h6>
				<div class="instances-list">
					{#each instances as instance (instance.instanceId)}
						<InstanceCard {instance} isTheaterAuthenticated={$isTheaterAuthenticated} {stoppingInstances} onStop={handleStopInstance} />
					{/each}
				</div>
			</div>
		{:else if $isTheaterAuthenticated}
			<div class="empty-state">
				<p class="has-text-grey">Inga aktiva servrar</p>
			</div>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<button class="button" on:click={handleClose}>Stäng</button>
	</svelte:fragment>
</Modal>

<style lang="scss">
	.launcher-modal-content {
		max-width: 100%;
		overflow: hidden;

		.status-header {
			margin-bottom: 1.5rem;
			padding-bottom: 1rem;
			border-bottom: 1px solid rgba(0, 0, 0, 0.1);

			.status-info {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				margin-bottom: 0.25rem;
				flex-wrap: wrap;

				.launcher-status-tag {
					font-size: 0.7rem;
					border-radius: 12px;
					flex-shrink: 0;
				}

				.adapter-name {
					font-size: 0.9rem;
					word-break: break-word;
					min-width: 0;
				}
			}
		}

		.launch-form-section {
			margin-bottom: 2rem;
			padding: 1rem;
			background-color: rgba(0, 0, 0, 0.02);
			border-radius: 8px;
			border: 1px solid rgba(0, 0, 0, 0.1);

			.launch-form-title {
				margin-bottom: 1rem;
				font-size: 0.9rem;
			}

			.notification {
				margin-top: 1rem;
				border-radius: 6px;
				font-size: 0.85rem;
			}
		}

		.notification {
			margin-bottom: 1.5rem;
			border-radius: 8px;
			word-wrap: break-word;
			overflow-wrap: break-word;
		}

		.instances-section {
			.instances-list {
				display: flex;
				flex-direction: column;
				gap: 1rem;
				max-width: 100%;
			}
		}

		.empty-state {
			text-align: center;
			padding: 2rem;
		}

		.level {
			margin-bottom: 0;
		}

		.buttons {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}

	@media screen and (max-width: 768px) {
		.launcher-modal-content {
			.status-header {
				.status-info {
					flex-direction: column;
					align-items: flex-start;
					gap: 0.5rem;
				}
			}

			.instances-section .instances-list {
				gap: 0.75rem;
			}

			.buttons {
				flex-direction: column;
				width: 100%;

				.button {
					width: 100%;
				}
			}
		}
	}
</style>
