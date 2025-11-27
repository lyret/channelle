<script lang="ts">
	import { wsPeerIdStore } from "~/api";
	import { showPeersStore } from "~/api/backstage";
	import { sessionsStore as roomSessionsStore, activeSpeakerStore as roomActiveSpeakerStore, roomState } from "~/api/stageNew";
	import PeerMediaStatus from "./PeerMediaStatus.svelte";
	import ConnectionStatus from "./ConnectionStatus.svelte";

	export let peerId: string;
	export let compact: boolean = true;

	$: peer = $showPeersStore[peerId];
	$: session = $roomSessionsStore[peerId];
	$: consumers = Array.from($roomState.consumers.values());
	$: activeSpeaker = $roomActiveSpeakerStore?.peerId;
	$: myPeerId = $wsPeerIdStore;
	$: isLocalPeer = peerId === myPeerId;

	$: isActiveSpeaker = activeSpeaker === peerId;
	$: hasVideoConsumer = consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === "cam-video");
	$: hasAudioConsumer = consumers.find((c) => c.appData.peerId === peerId && c.appData.mediaTag === "mic-audio");

	// For local peer, check producers instead of consumers
	$: hasLocalVideo = ($roomState.localStream?.getVideoTracks().length || 0) > 0;
	$: hasLocalAudio = ($roomState.localStream?.getAudioTracks().length || 0) > 0;
	$: hasVideoProducer = $roomState.producers.has("cam-video");
	$: hasAudioProducer = $roomState.producers.has("mic-audio");

	function getConsumerStatus(consumer: any) {
		if (!consumer) return "No Consumer";
		return consumer.paused ? "Paused" : "Active";
	}
</script>

<div class="debug-panel" class:compact>
	<div class="debug-header">
		<span class="debug-title">🔍 Debug: {peer?.name || peerId}</span>
	</div>

	<div class="debug-content">
		{#if compact}
			<!-- Compact view for Video component -->
			<div class="compact-info">
				<div class="info-row">
					<span class="info-label">Media:</span>
					<div class="compact-tags">
						{#if isLocalPeer}
							{#if hasLocalVideo}
								<span class="tag is-small is-success">📹</span>
							{:else}
								<span class="tag is-small is-light">📹</span>
							{/if}
							{#if hasLocalAudio}
								<span class="tag is-small is-success">🎤</span>
							{:else}
								<span class="tag is-small is-light">🎤</span>
							{/if}
						{:else}
							{#if session?.media?.["cam-video"]}
								<span class="tag is-small is-success">📹</span>
							{:else}
								<span class="tag is-small is-light">📹</span>
							{/if}
							{#if session?.media?.["mic-audio"]}
								<span class="tag is-small is-success">🎤</span>
							{:else}
								<span class="tag is-small is-light">🎤</span>
							{/if}
						{/if}
					</div>
				</div>

				<div class="info-row">
					<span class="info-label">{isLocalPeer ? "Producer" : "Consumer"}:</span>
					<div class="compact-tags">
						{#if isLocalPeer}
							{#if hasVideoProducer}
								<span class="tag is-small is-success">📹 Producing</span>
							{:else}
								<span class="tag is-small is-light">📹 None</span>
							{/if}
						{:else if hasVideoConsumer}
							<span class="tag is-small" class:is-success={!hasVideoConsumer.paused} class:is-warning={hasVideoConsumer.paused}>
								📹 {getConsumerStatus(hasVideoConsumer)}
							</span>
						{:else}
							<span class="tag is-small is-light">📹 None</span>
						{/if}
					</div>
				</div>

				<div class="info-row">
					<span class="info-label">Status:</span>
					<div class="compact-tags">
						{#if isLocalPeer}
							<span class="tag is-small is-primary">🏠 You</span>
						{:else}
							<span class="tag is-small" class:is-success={peer?.online} class:is-danger={!peer?.online}>
								{peer?.online ? "🟢 Online" : "🔴 Offline"}
							</span>
						{/if}
						{#if isActiveSpeaker}
							<span class="tag is-small is-primary">🗣️ Speaker</span>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<!-- Full view for detailed debugging -->
			<PeerMediaStatus {peerId} peerData={peer} sessionData={session} {isActiveSpeaker} />

			<ConnectionStatus {peerId} peerData={peer} isOnline={peer?.online || false} hasTransport={true} isMyPeer={isLocalPeer} />

			<div class="consumer-details">
				<h4 class="subtitle is-6">{isLocalPeer ? "Producer Details" : "Consumer Details"}</h4>
				{#if isLocalPeer}
					{#if hasVideoProducer}
						<div class="consumer-info">
							<span class="consumer-label">Video Producer:</span>
							<span class="tag is-small is-success">Active</span>
						</div>
					{/if}
					{#if hasAudioProducer}
						<div class="consumer-info">
							<span class="consumer-label">Audio Producer:</span>
							<span class="tag is-small is-success">Active</span>
						</div>
					{/if}
					{#if !hasVideoProducer && !hasAudioProducer}
						<p class="has-text-grey is-size-7">No active producers</p>
					{/if}
				{:else}
					{#if hasVideoConsumer}
						<div class="consumer-info">
							<span class="consumer-label">Video Consumer:</span>
							<span class="tag is-small" class:is-success={!hasVideoConsumer.paused} class:is-warning={hasVideoConsumer.paused}>
								{getConsumerStatus(hasVideoConsumer)}
							</span>
						</div>
					{/if}
					{#if hasAudioConsumer}
						<div class="consumer-info">
							<span class="consumer-label">Audio Consumer:</span>
							<span class="tag is-small" class:is-success={!hasAudioConsumer.paused} class:is-warning={hasAudioConsumer.paused}>
								{getConsumerStatus(hasAudioConsumer)}
							</span>
						</div>
					{/if}
					{#if !hasVideoConsumer && !hasAudioConsumer}
						<p class="has-text-grey is-size-7">No active consumers</p>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.debug-panel {
		background: rgba(0, 0, 0, 0.8);
		color: white;
		border-radius: 4px;
		font-size: 0.75rem;
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 10;
		max-width: 300px;

		&.compact {
			padding: 0.5rem;
			max-width: 250px;
		}

		&:not(.compact) {
			padding: 1rem;
			position: relative;
			top: auto;
			right: auto;
			max-width: none;
			background: white;
			color: #363636;
			border: 1px solid #dbdbdb;
		}
	}

	.debug-header {
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 0.25rem;
		margin-bottom: 0.5rem;

		.debug-panel:not(.compact) & {
			border-bottom-color: #dbdbdb;
		}
	}

	.debug-title {
		font-weight: 600;
		font-size: 0.8rem;
	}

	.debug-content {
		font-size: 0.7rem;
	}

	.compact-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.info-label {
		font-weight: 500;
		min-width: 60px;
		opacity: 0.8;
	}

	.compact-tags {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.consumer-details {
		margin-top: 0.75rem;
	}

	.consumer-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.consumer-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.tag {
		font-size: 0.6rem;
		padding: 0.2rem 0.4rem;
	}

	.subtitle {
		margin-bottom: 0.5rem;
	}
</style>
