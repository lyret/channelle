<script lang="ts">
	import { localMediaStreamStore, videoProducerStore, audioProducerStore } from "~/api/stage";
	import { wsPeerIdStore } from "~/api/_trpcClient";

	export let peerId: string;
	export let peerData: any;
	export let sessionData: any;
	export let isActiveSpeaker: boolean = false;

	$: myPeerId = $wsPeerIdStore;
	$: isLocalPeer = peerId === myPeerId;

	function getPeerMediaStatus(peer: any) {
		const session = peer.session || sessionData;
		if (!session || !session.media) {
			return { hasVideo: false, hasAudio: false, videoStatus: "Not transmitting", audioStatus: "Not transmitting" };
		}

		const hasVideo = !!session.media["cam-video"];
		const hasAudio = !!session.media["mic-audio"];
		const videoStatus = hasVideo ? (session.media["cam-video"].paused ? "Paused" : "Transmitting") : "Not transmitting";
		const audioStatus = hasAudio ? (session.media["mic-audio"].paused ? "Paused" : "Transmitting") : "Not transmitting";

		return { hasVideo, hasAudio, videoStatus, audioStatus };
	}

	function getLocalMediaStatus() {
		const hasVideo = ($localMediaStreamStore?.getVideoTracks().length || 0) > 0;
		const hasAudio = ($localMediaStreamStore?.getAudioTracks().length || 0) > 0;
		const videoStatus = $videoProducerStore ? "Producing" : hasVideo ? "Ready" : "Not available";
		const audioStatus = $audioProducerStore ? "Producing" : hasAudio ? "Ready" : "Not available";

		return { hasVideo, hasAudio, videoStatus, audioStatus };
	}

	$: mediaStatus = isLocalPeer ? getLocalMediaStatus() : getPeerMediaStatus({ session: sessionData });
	$: peerName = peerData?.name || peerId || "Unknown";
</script>

<div class="peer-media-status">
	<div class="peer-header">
		<span class="peer-name">{peerName}</span>
		{#if isLocalPeer}
			<span class="tag is-small is-primary">You</span>
		{/if}
		{#if isActiveSpeaker}
			<span class="tag is-small is-success">Active Speaker</span>
		{/if}
	</div>

	<div class="media-indicators">
		<span
			class="tag is-small"
			class:is-success={mediaStatus.hasVideo && (mediaStatus.videoStatus === "Transmitting" || mediaStatus.videoStatus === "Producing")}
			class:is-warning={mediaStatus.hasVideo && (mediaStatus.videoStatus === "Paused" || mediaStatus.videoStatus === "Ready")}
			class:is-light={!mediaStatus.hasVideo}
		>
			{#if mediaStatus.hasVideo && (mediaStatus.videoStatus === "Transmitting" || mediaStatus.videoStatus === "Producing")}
				📹 {isLocalPeer ? "Video" : "Video"}
			{:else if mediaStatus.hasVideo && (mediaStatus.videoStatus === "Paused" || mediaStatus.videoStatus === "Ready")}
				📹 {isLocalPeer ? "Ready" : "Paused"}
			{:else}
				📹 Off
			{/if}
		</span>

		<span
			class="tag is-small"
			class:is-success={mediaStatus.hasAudio && (mediaStatus.audioStatus === "Transmitting" || mediaStatus.audioStatus === "Producing")}
			class:is-warning={mediaStatus.hasAudio && (mediaStatus.audioStatus === "Paused" || mediaStatus.audioStatus === "Ready")}
			class:is-light={!mediaStatus.hasAudio}
		>
			{#if mediaStatus.hasAudio && (mediaStatus.audioStatus === "Transmitting" || mediaStatus.audioStatus === "Producing")}
				🎤 {isLocalPeer ? "Audio" : "Audio"}
			{:else if mediaStatus.hasAudio && (mediaStatus.audioStatus === "Paused" || mediaStatus.audioStatus === "Ready")}
				🎤 {isLocalPeer ? "Ready" : "Paused"}
			{:else}
				🎤 Off
			{/if}
		</span>
	</div>
</div>

<style lang="scss">
	.peer-media-status {
		padding: 0.5rem;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		background: #fafafa;
	}

	.peer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
	}

	.peer-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.media-indicators {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.tag {
		font-size: 0.75rem;
	}
</style>
