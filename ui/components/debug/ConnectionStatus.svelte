<script lang="ts">
	export let peerId: string;
	export let peerData: any;
	export let isOnline: boolean = false;
	export let hasTransport: boolean = false;
	export let isMyPeer: boolean = false;

	$: connectionClass = isOnline ? "is-success" : "is-danger";
	$: transportClass = hasTransport ? "is-success" : "is-danger";
	$: peerName = peerData?.name || peerId || "Unknown";
</script>

<div class="connection-status">
	<div class="connection-header">
		<span class="peer-name">{peerName}</span>
		{#if isMyPeer}
			<span class="tag is-small is-primary">Me</span>
		{/if}
	</div>

	<div class="status-indicators">
		<div class="status-item">
			<span class="status-label">Connection:</span>
			<span class="tag is-small {connectionClass}">
				{isOnline ? "Online" : "Offline"}
			</span>
		</div>

		<div class="status-item">
			<span class="status-label">Transport:</span>
			<span class="tag is-small {transportClass}">
				{hasTransport ? "Connected" : "Disconnected"}
			</span>
		</div>

		{#if peerData?.actor || peerData?.manager}
			<div class="status-item">
				<span class="status-label">Role:</span>
				<div class="role-tags">
					{#if peerData.actor}
						<span class="tag is-small is-success">Actor</span>
					{/if}
					{#if peerData.manager}
						<span class="tag is-small is-info">Manager</span>
					{/if}
				</div>
			</div>
		{/if}

		{#if peerData?.banned}
			<div class="status-item">
				<span class="status-label">Status:</span>
				<span class="tag is-small is-danger">Banned</span>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.connection-status {
		padding: 0.75rem;
		border: 1px solid #dbdbdb;
		border-radius: 6px;
		background: #ffffff;
		margin-bottom: 0.5rem;
	}

	.connection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid #f5f5f5;
		padding-bottom: 0.25rem;
	}

	.peer-name {
		font-weight: 600;
		font-size: 0.875rem;
		color: #363636;
	}

	.status-indicators {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-label {
		font-size: 0.75rem;
		color: #757575;
		font-weight: 500;
		min-width: 70px;
	}

	.role-tags {
		display: flex;
		gap: 0.25rem;
	}

	.tag {
		font-size: 0.7rem;
	}
</style>
