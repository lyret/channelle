<script lang="ts">
	import { getDebugState, logDebugState } from "~/api/media";
	import { onMount, onDestroy } from "svelte";

	export let peerId: string | null = null; // If null, shows all peers

	let updateInterval: ReturnType<typeof setInterval> | undefined;
	let debugState: ReturnType<typeof getDebugState>;
	let autoRefresh = true;
	let refreshRate = 2000; // 2 seconds
	let showDetails = false;
	let filterOfflinePeers = false;

	// Track historical data for troubleshooting
	let connectionHistory: Array<{
		timestamp: number;
		event: string;
		peerId: string;
		details: any;
	}> = [];

	function addToHistory(event: string, peerId: string, details: any) {
		connectionHistory = [
			{
				timestamp: Date.now(),
				event,
				peerId,
				details,
			},
			...connectionHistory.slice(0, 49), // Keep last 50 events
		];
	}

	function updateDebugState() {
		const newState = getDebugState();

		// Compare with previous state to detect changes
		if (debugState) {
			// Check for new consumers
			newState.consumers.forEach((consumer) => {
				const existing = debugState.consumers.find((c) => c.id === consumer.id);
				if (!existing) {
					addToHistory("Consumer Created", consumer.peerId, {
						consumerId: consumer.id,
						mediaTag: consumer.mediaTag,
						trackState: consumer.trackState,
					});
				} else if (existing.trackState !== consumer.trackState) {
					addToHistory("Consumer Track State Changed", consumer.peerId, {
						consumerId: consumer.id,
						oldState: existing.trackState,
						newState: consumer.trackState,
					});
				}
			});

			// Check for removed consumers
			debugState.consumers.forEach((consumer) => {
				const exists = newState.consumers.find((c) => c.id === consumer.id);
				if (!exists) {
					addToHistory("Consumer Removed", consumer.peerId, {
						consumerId: consumer.id,
						mediaTag: consumer.mediaTag,
					});
				}
			});

			// Check for peer online status changes
			newState.peers.forEach((peer) => {
				const existing = debugState.peers.find((p) => p.id === peer.id);
				if (existing && existing.online !== peer.online) {
					addToHistory(peer.online ? "Peer Online" : "Peer Offline", peer.id, {
						name: peer.name,
						online: peer.online,
					});
				}
			});

			// Check for transport state changes
			newState.transports.forEach((transport) => {
				const existing = debugState.transports.find((t) => t.peerId === transport.peerId);
				if (existing && existing.connectionState !== transport.connectionState) {
					addToHistory("Transport State Changed", transport.peerId, {
						transportId: transport.transportId,
						oldState: existing.connectionState,
						newState: transport.connectionState,
					});
				}
			});
		}

		debugState = newState;
	}

	function handleRefresh() {
		updateDebugState();
	}

	function handleLogState() {
		logDebugState("VIDEO_DEBUG");
	}

	function clearHistory() {
		connectionHistory = [];
	}

	function getStatusColor(status: string | boolean): string {
		switch (status) {
			case "connected":
			case "live":
			case true:
				return "has-text-success";
			case "connecting":
			case "checking":
				return "has-text-warning";
			case "disconnected":
			case "failed":
			case "closed":
			case "ended":
			case false:
				return "has-text-danger";
			default:
				return "has-text-info";
		}
	}

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString();
	}

	function getFilteredPeers() {
		if (!debugState) return [];

		let peers = debugState.peers;

		if (peerId) {
			peers = peers.filter((p) => p.id === peerId);
		}

		if (filterOfflinePeers) {
			peers = peers.filter((p) => p.online);
		}

		return peers;
	}

	function getConsumersForPeer(peerIdToCheck: string) {
		return debugState?.consumers.filter((c) => c.peerId === peerIdToCheck) || [];
	}

	function getTransportForPeer(peerIdToCheck: string) {
		return debugState?.transports.find((t) => t.peerId === peerIdToCheck);
	}

	function getSessionForPeer(peerIdToCheck: string) {
		return debugState?.sessions.find((s) => s.id === peerIdToCheck);
	}

	onMount(() => {
		updateDebugState();
		if (autoRefresh) {
			updateInterval = setInterval(updateDebugState, refreshRate);
		}
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});

	$: if (autoRefresh && !updateInterval) {
		updateInterval = setInterval(updateDebugState, refreshRate);
	} else if (!autoRefresh && updateInterval) {
		clearInterval(updateInterval);
		updateInterval = undefined;
	}

	$: filteredPeers = getFilteredPeers();
</script>

<div class="video-connection-debug">
	<div class="box">
		<div class="level is-mobile">
			<div class="level-left">
				<div class="level-item">
					<h4 class="title is-5">
						Video Connection Debug
						{#if peerId}
							- {peerId.slice(-8)}
						{/if}
					</h4>
				</div>
			</div>
			<div class="level-right">
				<div class="level-item">
					<div class="field is-grouped">
						<div class="control">
							<label class="checkbox">
								<input type="checkbox" bind:checked={autoRefresh} />
								Auto Refresh
							</label>
						</div>
						<div class="control">
							<button class="button is-small is-info" on:click={handleRefresh}>Refresh Now</button>
						</div>
						<div class="control">
							<button class="button is-small is-primary" on:click={handleLogState}>Log to Console</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="level is-mobile mb-4">
			<div class="level-left">
				<div class="level-item">
					<div class="field is-grouped">
						<div class="control">
							<label class="checkbox">
								<input type="checkbox" bind:checked={showDetails} />
								Show Details
							</label>
						</div>
						<div class="control">
							<label class="checkbox">
								<input type="checkbox" bind:checked={filterOfflinePeers} />
								Hide Offline Peers
							</label>
						</div>
					</div>
				</div>
			</div>
			<div class="level-right">
				<div class="level-item">
					<div class="select is-small">
						<select bind:value={refreshRate}>
							<option value={1000}>1s</option>
							<option value={2000}>2s</option>
							<option value={5000}>5s</option>
							<option value={10000}>10s</option>
						</select>
					</div>
				</div>
			</div>
		</div>

		{#if debugState}
			<!-- Summary Stats -->
			<div class="columns is-multiline">
				<div class="column is-3">
					<div class="has-text-centered p-3 has-background-light">
						<p class="heading">Total Peers</p>
						<p class="title is-4">{debugState.peers.length}</p>
					</div>
				</div>
				<div class="column is-3">
					<div class="has-text-centered p-3 has-background-light">
						<p class="heading">Online Peers</p>
						<p class="title is-4">{debugState.peers.filter((p) => p.online).length}</p>
					</div>
				</div>
				<div class="column is-3">
					<div class="has-text-centered p-3 has-background-light">
						<p class="heading">Active Consumers</p>
						<p class="title is-4">{debugState.consumers.length}</p>
					</div>
				</div>
				<div class="column is-3">
					<div class="has-text-centered p-3 has-background-light">
						<p class="heading">Transports</p>
						<p class="title is-4">{debugState.transports.length}</p>
					</div>
				</div>
			</div>

			<!-- Peer Details -->
			<div class="mt-5">
				<h5 class="title is-6">Peer Connection Details</h5>
				{#each filteredPeers as peer (peer.id)}
					{@const consumers = getConsumersForPeer(peer.id)}
					{@const transport = getTransportForPeer(peer.id)}
					{@const session = getSessionForPeer(peer.id)}

					<div class="card mb-3">
						<header class="card-header">
							<p class="card-header-title">
								<span class="icon">
									<i class="fas fa-user" class:has-text-success={peer.online} class:has-text-danger={!peer.online}></i>
								</span>
								{peer.name || peer.id.slice(-8)}
								<span class="tag is-small ml-2" class:is-success={peer.online} class:is-danger={!peer.online}>
									{peer.online ? "Online" : "Offline"}
								</span>
							</p>
							<button class="card-header-icon" class:is-active={showDetails} on:click={() => (showDetails = !showDetails)}>
								<span class="icon">
									<i class="fas fa-angle-down"></i>
								</span>
							</button>
						</header>

						<div class="card-content">
							<div class="columns is-multiline">
								<!-- Session Info -->
								<div class="column is-4">
									<div class="content">
										<p class="heading">Session</p>
										{#if session}
											<p>
												<span class="icon-text">
													<span class="icon">
														<i
															class="fas fa-video"
															class:has-text-success={session.videoAvailable}
															class:has-text-danger={!session.videoAvailable}
														></i>
													</span>
													<span>Video: {session.videoAvailable ? "Available" : "Not Available"}</span>
												</span>
											</p>
											<p>
												<span class="icon-text">
													<span class="icon">
														<i
															class="fas fa-microphone"
															class:has-text-success={session.audioAvailable}
															class:has-text-danger={!session.audioAvailable}
														></i>
													</span>
													<span>Audio: {session.audioAvailable ? "Available" : "Not Available"}</span>
												</span>
											</p>
										{:else}
											<p class="has-text-danger">No session data</p>
										{/if}
									</div>
								</div>

								<!-- Transport Info -->
								<div class="column is-4">
									<div class="content">
										<p class="heading">Transport</p>
										{#if transport}
											<p>
												<span class="tag is-small {getStatusColor(transport.connectionState)}">
													{transport.connectionState}
												</span>
											</p>
											{#if showDetails}
												<p class="is-size-7">
													ID: {transport.transportId.slice(-8)}<br />
													ICE: {transport.iceConnectionState}<br />
													DTLS: {transport.dtlsState}
												</p>
											{/if}
										{:else}
											<p class="has-text-grey">No transport</p>
										{/if}
									</div>
								</div>

								<!-- Consumers Info -->
								<div class="column is-4">
									<div class="content">
										<p class="heading">Consumers ({consumers.length})</p>
										{#each consumers as consumer (consumer.id)}
											<div class="mb-2">
												<span class="tag is-small {getStatusColor(consumer.trackState)} mr-1">
													{consumer.mediaTag}
												</span>
												{#if showDetails}
													<p class="is-size-7 mt-1">
														ID: {consumer.id.slice(-8)}<br />
														Track: {consumer.trackState || "none"}<br />
														Paused: {consumer.paused ? "Yes" : "No"}
													</p>
												{/if}
											</div>
										{:else}
											<p class="has-text-grey">No consumers</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="notification is-info is-light">No peers found matching current filters.</div>
				{/each}
			</div>

			<!-- Connection History -->
			{#if connectionHistory.length > 0}
				<div class="mt-5">
					<div class="level">
						<div class="level-left">
							<div class="level-item">
								<h5 class="title is-6">Connection History</h5>
							</div>
						</div>
						<div class="level-right">
							<div class="level-item">
								<button class="button is-small is-light" on:click={clearHistory}> Clear History </button>
							</div>
						</div>
					</div>

					<div class="box has-background-grey-lighter" style="max-height: 300px; overflow-y: auto;">
						{#each connectionHistory as event (event.timestamp)}
							<div class="is-size-7 mb-1">
								<span class="has-text-grey">{formatTimestamp(event.timestamp)}</span>
								<span class="has-text-weight-semibold ml-2">{event.event}</span>
								<span class="has-text-info ml-1">({event.peerId.slice(-8)})</span>
								{#if showDetails}
									<pre class="is-size-7 mt-1 ml-4">{JSON.stringify(event.details, null, 2)}</pre>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{:else}
			<div class="notification is-warning">Loading debug state...</div>
		{/if}
	</div>
</div>

<style>
	.video-connection-debug {
		font-family: "Monaco", "Menlo", monospace;
		font-size: 12px;
	}

	.card-header-icon.is-active {
		transform: rotate(180deg);
	}

	pre {
		background: rgba(0, 0, 0, 0.05);
		padding: 4px;
		border-radius: 2px;
		max-width: 400px;
		overflow-x: auto;
	}

	.icon-text {
		align-items: center;
	}
</style>
