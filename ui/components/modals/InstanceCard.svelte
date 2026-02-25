<script lang="ts">
	import IconStop from "~/components/picol/icons/Picol-controls-stop.svelte";

	export let instance: any;
	export let isTheaterAuthenticated: boolean = false;
	export let stoppingInstances: Set<string> = new Set();
	export let onStop: (instanceId: string) => void = () => {};

	function handleStopInstance() {
		if (instance && instance.instanceId) {
			onStop(instance.instanceId);
		}
	}

	// Helper function to format date
	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return "N/A";
		try {
			return new Date(dateString).toLocaleString("sv-SE");
		} catch {
			return "N/A";
		}
	}

	// Get status classes
	$: statusClasses = {
			"is-success": instance?.status === "running",
			"is-warning": instance?.status === "starting",
			"is-danger": instance?.status === "error",
			"is-light": instance?.status === "stopped"
		};

	$: isStopping = stoppingInstances.has(instance?.instanceId);
</script>

<div class="instance-card">
	<div class="instance-header">
		<div class="instance-primary">
			{#if instance.showId}
				<div class="instance-show">
					<span class="show-name has-text-weight-bold">
						{instance.show?.name || "Okänd"}
					</span>
					<span class="show-id has-text-grey">(ID: {instance.showId})</span>
				</div>
			{/if}
			{#if instance.createdAt}
				<div class="instance-created">
					<span class="has-text-grey">Skapad:</span>
					<span class="has-text-weight-semibold">
						{formatDate(instance.createdAt)}
					</span>
				</div>
			{/if}
		</div>

		<div class="instance-secondary">
			<span class="instance-status tag" class:is-success={instance.status === "running"}
				class:is-warning={instance.status === "starting"} class:is-danger={instance.status === "error"}
				class:is-light={instance.status === "stopped"}>
				{instance.status}
			</span>
			<span class="instance-id is-family-code has-text-grey">
				{instance.instanceId?.slice(-8)}
			</span>
			{#if instance.port}
				<span class="instance-port has-text-grey">
					Port: {instance.port}
				</span>
			{/if}
		</div>
	</div>

	{#if instance.stoppedAt}
		<div class="instance-stopped">
			<span class="has-text-grey">Avslutad:</span>
			<span>{formatDate(instance.stoppedAt)}</span>
		</div>
	{/if}

	{#if isTheaterAuthenticated && instance.status !== "stopped"}
		<div class="instance-actions">
			<button class="button is-small is-danger is-outlined is-fullwidth"
				class:is-loading={isStopping}
				disabled={isStopping}
				on:click={handleStopInstance}>
				<span class="icon is-small">
					<IconStop />
				</span>
				<span>Stoppa</span>
			</button>
		</div>
	{/if}
</div>

<style lang="scss">
	.instance-card {
		background-color: rgba(0, 0, 0, 0.02);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		padding: 1rem;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 0.5rem;
		transition: all 0.2s ease;

		&:hover {
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
			transform: translateY(-1px);
		}

		.instance-header {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			margin-bottom: 0.75rem;
			padding-bottom: 0.75rem;
			border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		}

		.instance-primary {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			margin-bottom: 0.5rem;
		}

		.instance-show {
			display: flex;
			gap: 0.5rem;
			align-items: baseline;
			flex-wrap: wrap;
		}

		.show-name {
			font-size: 1.1rem;
			color: var(--channelle-text-color);
			line-height: 1.4;
		}

		.show-id {
			font-size: 0.9rem;
			opacity: 0.7;
			white-space: nowrap;
		}

		.instance-created {
			display: flex;
			gap: 0.5rem;
			align-items: baseline;
			font-size: 0.9rem;
		}

		.instance-secondary {
			display: flex;
			gap: 1rem;
			align-items: center;
			flex-wrap: wrap;
			font-size: 0.9rem;
			color: #666;
			padding-top: 0.5rem;
			border-top: 1px solid rgba(0, 0, 0, 0.05);
		}

		.instance-status {
			font-size: 0.8rem;
			border-radius: 12px;
			padding: 0.2rem 0.6rem;
			flex-shrink: 0;
			font-weight: 500;
		}

		.instance-id {
			font-size: 0.85rem;
			opacity: 0.8;
			word-break: break-all;
			min-width: 0;
		}

		.instance-port {
			font-size: 0.85rem;
			margin-left: auto;
			padding-left: 1rem;
			border-left: 1px solid rgba(0, 0, 0, 0.1);
			white-space: nowrap;
		}

		.instance-stopped {
			display: flex;
			gap: 0.5rem;
			margin-top: 0.75rem;
			font-size: 0.85rem;
			color: #888;
			padding: 0.5rem 0;
			border-top: 1px solid rgba(0, 0, 0, 0.05);
		}

		.instance-actions {
			border-top: 1px solid rgba(0, 0, 0, 0.1);
			padding-top: 0.75rem;
			margin-top: 0.75rem;
		}
	}

	@media screen and (max-width: 768px) {
		.instance-card {
			padding: 0.75rem;

			.instance-header {
				flex-direction: column;
				align-items: flex-start;
				gap: 0.5rem;
			}

			.instance-secondary {
				flex-direction: column;
				align-items: flex-start;
				gap: 0.5rem;

				.instance-port {
					margin-left: 0;
					padding-left: 0;
					border-left: none;
					margin-top: 0.25rem;
				}
			}
		}
	}
</style>
