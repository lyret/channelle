<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import {
		launcherReadyStore,
		activeAdapterStore,
		adapterStatusStore,
		instancesStore,
		runningInstancesCountStore,
		launcherErrorStore,
		startLauncherSync,
		stopAllInstances,
	} from "~/api/launchers";
	import { isTheaterAuthenticated } from "~/stores/theaterAuth";
	import IconSettings from "~/components/picol/icons/Picol-settings.svelte";
	import IconStop from "~/components/picol/icons/Picol-controls-stop.svelte";
	import IconRefresh from "~/components/picol/icons/Picol-refresh.svelte";

	let syncCleanup: (() => void) | null = null;
	let isStoppingAll = false;

	onMount(() => {
		// Start auto-sync when component mounts
		syncCleanup = startLauncherSync(3000); // Sync every 3 seconds
	});

	onDestroy(() => {
		// Clean up sync when component unmounts
		if (syncCleanup) {
			syncCleanup();
		}
	});

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

	function handleRefresh() {
		if (syncCleanup) {
			syncCleanup();
		}
		syncCleanup = startLauncherSync(3000);
	}

	// Swedish adapter names mapping
	const adapterNames = {
		none: "Ingen",
		local: "Samma server",
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

<div class="launcher-status">
	<div class="level is-mobile">
		<div class="level-left">
			<div class="level-item">
				<div class="launcher-info">
					<div class="launcher-header">
						<span class="icon is-small launcher-icon">
							<IconSettings />
						</span>
						<span class="launcher-title is-family-secondary">Launcher System</span>
						<span
							class="tag launcher-status-tag"
							class:is-success={isReady && canLaunch}
							class:is-warning={isReady && !canLaunch}
							class:is-danger={!isReady}
						>
							{#if !isReady}
								Not Ready
							{:else if canLaunch}
								Ready
							{:else}
								Limited
							{/if}
						</span>
					</div>

					<div class="launcher-details">
						{#if activeAdapter}
							<p class="is-size-7 has-text-grey-light">
								<strong>Adapter:</strong>
								{getAdapterDisplayName(activeAdapter)}
							</p>
						{/if}

						{#if runningCount > 0}
							<p class="is-size-7 has-text-grey-light">
								<strong>Running:</strong>
								{runningCount} instance{runningCount !== 1 ? "s" : ""}
							</p>
						{/if}

						{#if adapterStatus?.reason && !canLaunch}
							<p class="is-size-7 has-text-warning">
								{adapterStatus.reason}
							</p>
						{/if}

						{#if error}
							<p class="is-size-7 has-text-danger">
								<strong>Error:</strong>
								{error}
							</p>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="level-right">
			<div class="level-item">
				<div class="buttons">
					<!-- Refresh button -->
					<button class="button is-small is-outlined" on:click={handleRefresh} title="Refresh launcher status">
						<span class="icon is-small">
							<IconRefresh />
						</span>
					</button>

					<!-- Stop all button - only show if authenticated and have running instances -->
					{#if $isTheaterAuthenticated && runningCount > 0}
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
							<span>Stop All</span>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Instance list - only show if there are instances and user is authenticated -->
	{#if $isTheaterAuthenticated && instances.length > 0}
		<div class="instances-preview">
			<div class="instances-list">
				{#each instances.slice(0, 3) as instance (instance.instanceId)}
					<div class="instance-item">
						<span
							class="instance-status tag is-small"
							class:is-success={instance.status === "running"}
							class:is-warning={instance.status === "starting"}
							class:is-danger={instance.status === "error"}
							class:is-light={instance.status === "stopped"}
						>
							{instance.status}
						</span>
						<span class="instance-id is-size-7 is-family-code">
							{instance.instanceId.slice(-8)}
						</span>
						{#if instance.port}
							<span class="instance-port is-size-7 has-text-grey">
								:{instance.port}
							</span>
						{/if}
					</div>
				{/each}
				{#if instances.length > 3}
					<div class="instance-item">
						<span class="is-size-7 has-text-grey">
							+{instances.length - 3} more...
						</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.launcher-status {
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.launcher-info {
		.launcher-header {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 0.5rem;

			.launcher-icon {
				color: var(--channelle-menu-text-color);
			}

			.launcher-title {
				font-weight: 600;
				color: var(--channelle-menu-text-color);
			}

			.launcher-status-tag {
				font-size: 0.7rem;
				border-radius: 12px;
			}
		}

		.launcher-details {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;

			p {
				margin: 0;
				line-height: 1.2;
			}
		}
	}

	.instances-preview {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);

		.instances-list {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.instance-item {
			display: flex;
			align-items: center;
			gap: 0.25rem;
			background-color: rgba(0, 0, 0, 0.2);
			padding: 0.25rem 0.5rem;
			border-radius: 4px;
			font-size: 0.8rem;

			.instance-status {
				margin: 0;
			}

			.instance-id {
				color: var(--channelle-menu-text-color);
				opacity: 0.8;
			}

			.instance-port {
				opacity: 0.6;
			}
		}
	}

	.level {
		margin-bottom: 0;
	}

	@include mobile {
		.launcher-status {
			padding: 0.75rem;
		}

		.instances-preview {
			.instances-list {
				gap: 0.25rem;
			}

			.instance-item {
				font-size: 0.75rem;
				padding: 0.2rem 0.4rem;
			}
		}
	}
</style>
