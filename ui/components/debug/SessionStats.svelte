<script lang="ts">
	import { consumersStore, peersStore, sessionsStore, currentActiveSpeakerStore, hasJoinedRoomStore, deviceStore } from "~/api/room";

	$: consumers = $consumersStore;
	$: peers = $peersStore;
	$: sessions = $sessionsStore;
	$: activeSpeaker = $currentActiveSpeakerStore?.peerId;
	$: hasJoined = $hasJoinedRoomStore;
	$: device = $deviceStore;

	$: peersList = Object.entries(peers).map(([peerId, info]) => ({
		peerId,
		...info,
		session: sessions[peerId],
	}));

	$: stats = {
		totalPeers: peersList.length,
		onlinePeers: peersList.filter((p) => p.online).length,
		offlinePeers: peersList.filter((p) => !p.online).length,
		peersWithMedia: peersList.filter((p) => p.session?.media).length,
		peersWithVideo: peersList.filter((p) => p.session?.media?.["cam-video"]).length,
		peersWithAudio: peersList.filter((p) => p.session?.media?.["mic-audio"]).length,
		totalConsumers: consumers.length,
		activeConsumers: consumers.filter((c) => !c.paused).length,
		pausedConsumers: consumers.filter((c) => c.paused).length,
		videoConsumers: consumers.filter((c) => c.appData.mediaTag?.includes("video")).length,
		audioConsumers: consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length,
		uniqueConsumedPeers: new Set(consumers.map((c) => c.appData.peerId)).size,
	};

	$: mediaStats = peersList.reduce(
		(acc, peer) => {
			if (!peer.session?.media) return acc;

			const media = peer.session.media;
			if (media["cam-video"]) {
				acc.videoTransmitting += media["cam-video"].paused ? 0 : 1;
				acc.videoPaused += media["cam-video"].paused ? 1 : 0;
			}
			if (media["mic-audio"]) {
				acc.audioTransmitting += media["mic-audio"].paused ? 0 : 1;
				acc.audioPaused += media["mic-audio"].paused ? 1 : 0;
			}

			return acc;
		},
		{
			videoTransmitting: 0,
			videoPaused: 0,
			audioTransmitting: 0,
			audioPaused: 0,
		},
	);
</script>

<div class="session-stats">
	<h3 class="title is-5">📊 Session Statistics</h3>

	<div class="columns">
		<div class="column is-6">
			<div class="box">
				<h4 class="subtitle is-6">Connection Status</h4>
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">My Status:</span>
						<span class="tag is-small is-success" class:is-success={hasJoined} class:is-danger={!hasJoined}>
							{hasJoined ? "Connected" : "Disconnected"}
						</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Device:</span>
						<span class="tag is-small is-info">
							{device ? "Supported" : "Unsupported"}
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="column is-6">
			<div class="box">
				<h4 class="subtitle is-6">Peer Overview</h4>
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">Total Peers:</span>
						<span class="tag is-small">{stats.totalPeers}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Online:</span>
						<span class="tag is-small is-success">{stats.onlinePeers}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Offline:</span>
						<span class="tag is-small is-danger">{stats.offlinePeers}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">With Media:</span>
						<span class="tag is-small is-info">{stats.peersWithMedia}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="columns">
		<div class="column is-6">
			<div class="box">
				<h4 class="subtitle is-6">Media Statistics</h4>
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">Video Active:</span>
						<span class="tag is-small is-success">{mediaStats.videoTransmitting}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Video Paused:</span>
						<span class="tag is-small is-warning">{mediaStats.videoPaused}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Audio Active:</span>
						<span class="tag is-small is-success">{mediaStats.audioTransmitting}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Audio Paused:</span>
						<span class="tag is-small is-warning">{mediaStats.audioPaused}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="column is-6">
			<div class="box">
				<h4 class="subtitle is-6">Consumer Statistics</h4>
				<div class="stats-grid">
					<div class="stat-item">
						<span class="stat-label">Total Consumers:</span>
						<span class="tag is-small">{stats.totalConsumers}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Active:</span>
						<span class="tag is-small is-success">{stats.activeConsumers}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Paused:</span>
						<span class="tag is-small is-warning">{stats.pausedConsumers}</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Video/Audio:</span>
						<span class="tag is-small is-info">{stats.videoConsumers}/{stats.audioConsumers}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if activeSpeaker}
		<div class="box">
			<h4 class="subtitle is-6">🗣️ Active Speaker</h4>
			<div class="active-speaker-info">
				<span class="speaker-name">{peers[activeSpeaker]?.name || activeSpeaker}</span>
				<span class="tag is-small is-primary">Currently Speaking</span>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.session-stats {
		padding: 1rem;
	}

	.stats-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
	}

	.stat-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #4a4a4a;
	}

	.active-speaker-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.speaker-name {
		font-weight: 600;
		color: #363636;
	}

	.box {
		margin-bottom: 1rem;
	}

	.subtitle {
		margin-bottom: 0.75rem;
		color: #363636;
	}

	.tag {
		font-size: 0.75rem;
	}

	.title {
		margin-bottom: 1.5rem;
		color: #363636;
	}
</style>
