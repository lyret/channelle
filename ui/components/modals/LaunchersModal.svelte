<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import Modal from "./_Modal.svelte";
	import {
		launcherReadyStore,
		activeAdapterStore,
		adapterStatusStore,
		instancesStore,
		runningInstancesCountStore,
		launcherErrorStore,
		startLauncherSync,
		stopAllInstances,
		stopInstance,
	} from "~/api/launchers";
	import { isTheaterAuthenticated } from "~/api/auth";
	import IconSettings from "~/components/picol/icons/Picol-settings.svelte";
	import IconStop from "~/components/picol/icons/Picol-controls-stop.svelte";
	import IconRefresh from "~/components/picol/icons/Picol-refresh.svelte";

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let isVisible = false;

	let syncCleanup: (() => void) | null = null;
	let isStoppingAll = false;
	let stoppingInstances = new Set<string>();

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

	function handleRefresh() {
		if (syncCleanup) {
			syncCleanup();
		}
		syncCleanup = startLauncherSync(3000);
	}

	// Swedish adapter names mapping
	const adapterNames = {
		none: " - Ingen - ",
		local: "lokal hårdvara",
		digitalocean: "DigitalOcean",
	};

	// Helper function to get Swedish adapter name
	function getAdapterDisplayName(adapterName: string | null): string {
		if (!adapterName) return "Okänd";
		return adapterNames[adapterName as keyof typeof adapterNames] || adapterName;
	}

	// Reactive statements for display
	$: isReady = $launcherReadyStore;
	$: activeAdapter = $activeAdapterStore;
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

		<!-- Instances List -->
		{#if $isTheaterAuthenticated && instances.length > 0}
			<div class="instances-section">
				<h6 class="title is-6 mb-3">Aktiva servrar</h6>
				<div class="instances-grid">
					{#each instances as instance (instance.instanceId)}
						<div class="instance-card">
							<div class="instance-header">
								<span
									class="instance-status tag"
									class:is-success={instance.status === "running"}
									class:is-warning={instance.status === "starting"}
									class:is-danger={instance.status === "error"}
									class:is-light={instance.status === "stopped"}
								>
									{instance.status}
								</span>
								<span class="instance-id is-family-code has-text-weight-semibold">
									{instance.instanceId.slice(-8)}
								</span>
							</div>

							<div class="instance-details">
								{#if instance.port}
									<p class="detail-item">
										<span class="has-text-grey">Port:</span>
										<span class="has-text-weight-semibold">{instance.port}</span>
									</p>
								{/if}
								{#if instance.showId}
									<p class="detail-item">
										<span class="has-text-grey">Show ID:</span>
										<span class="has-text-weight-semibold">{instance.showId}</span>
									</p>
								{/if}
								{#if instance.createdAt}
									<p class="detail-item">
										<span class="has-text-grey">Skapad:</span>
										<span>{new Date(instance.createdAt).toLocaleString("sv-SE")}</span>
									</p>
								{/if}
							</div>

							{#if $isTheaterAuthenticated && instance.status !== "stopped"}
								<div class="instance-actions">
									<button
										class="button is-small is-danger is-outlined is-fullwidth"
										class:is-loading={stoppingInstances.has(instance.instanceId)}
										disabled={stoppingInstances.has(instance.instanceId)}
										on:click={() => handleStopInstance(instance.instanceId)}
									>
										<span class="icon is-small">
											<IconStop />
										</span>
										<span>Stoppa</span>
									</button>
								</div>
							{/if}
						</div>
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

		.notification {
			margin-bottom: 1.5rem;
			border-radius: 8px;
			word-wrap: break-word;
			overflow-wrap: break-word;
		}

		.instances-section {
			.instances-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
				gap: 1rem;
				max-width: 100%;
			}

			.instance-card {
				background-color: rgba(0, 0, 0, 0.02);
				border: 1px solid rgba(0, 0, 0, 0.1);
				border-radius: 8px;
				padding: 1rem;
				min-width: 0;
				max-width: 100%;
				box-sizing: border-box;

				.instance-header {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					margin-bottom: 0.75rem;
					flex-wrap: wrap;

					.instance-status {
						margin: 0;
						flex-shrink: 0;
					}

					.instance-id {
						font-size: 0.9rem;
						word-break: break-all;
						min-width: 0;
					}
				}

				.instance-details {
					margin-bottom: 1rem;

					.detail-item {
						display: flex;
						justify-content: space-between;
						margin-bottom: 0.25rem;
						font-size: 0.85rem;
						gap: 0.5rem;
						min-width: 0;

						span:last-child {
							word-break: break-all;
							text-align: right;
							min-width: 0;
						}

						&:last-child {
							margin-bottom: 0;
						}
					}
				}

				.instance-actions {
					border-top: 1px solid rgba(0, 0, 0, 0.1);
					padding-top: 0.75rem;
				}
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

			.instances-section .instances-grid {
				grid-template-columns: 1fr;
				gap: 0.75rem;
			}

			.instance-card {
				padding: 0.75rem;

				.instance-header {
					flex-direction: column;
					align-items: flex-start;
					gap: 0.5rem;
				}

				.instance-details .detail-item {
					font-size: 0.8rem;
					flex-direction: column;
					align-items: flex-start;
					gap: 0.25rem;

					span:last-child {
						text-align: left;
					}
				}
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
