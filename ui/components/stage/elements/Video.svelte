<script lang="ts">
	import { peersStore, consumersStore, sessionsStore, subscribeToTrack } from "~/api/room";

	export let peerId: string;

	$: peer = $peersStore[peerId];
	$: session = $sessionsStore[peerId];

	$: stream = findStream(peerId);

	$: console.log({ peerId, peer, peersStore: $peersStore, session, stream });

	// Check if peer has video available and we don't have a consumer for it
	$: hasVideoAvailable = session && session.media && session.media["cam-video"];
	$: hasVideoConsumer = $consumersStore.find((consumer) => consumer.appData.peerId === peerId && consumer.appData.mediaTag === "cam-video");

	// Auto-subscribe to video track when peer has video but we don't have a consumer
	$: {
		if (hasVideoAvailable && !hasVideoConsumer) {
			console.log(`[Video] Auto-subscribing to video track for peer ${peerId}`);
			subscribeToTrack(peerId, "cam-video").catch((error) => {
				console.error(`[Video] Failed to subscribe to video track for peer ${peerId}:`, error);
			});
		}
	}

	function findStream(peerId: string) {
		const consumer = $consumersStore.find((consumer) => consumer.appData.peerId === peerId && consumer.appData.mediaTag === "cam-video");
		if (consumer) {
			console.log("HERE", consumer);
			return new MediaStream([consumer.track]);
		}
		return undefined;
	}

	$: streamHasVideo = stream ? !!stream.getVideoTracks().length : false;
	$: streamHasAudio = stream ? !!stream.getAudioTracks().length : false;

	function srcObject(node: any, stream: any) {
		if (!stream) {
			return undefined;
		}

		node.srcObject = stream;
		return {
			update(newStream: any) {
				if (node.srcObject != newStream) {
					node.srcObject = newStream;
				}
			},
		};
	}
</script>

{#if peer && !streamHasVideo}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{peer.name}
		</h1>
	</div>
{:else}
	<div class="window">
		<h1 class="title has-text-white">
			{peer?.name}
		</h1>
		<video use:srcObject={stream} controls={false} autoplay={false} playsinline muted={!streamHasAudio}></video>
	</div>
{/if}

<style>
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.window {
		background-color: green;
		color: var(--channelle-main-bg-color);
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 0;
		position: relative;
		margin: 0;
		padding: 8px;
		display: block;
		overflow: none;
		max-height: 100%;
	}

	.text-window {
		width: 100%;
		height: 100%;
		text-align: center;
		display: flex;
		align-items: center;
		align-content: center;
		justify-items: center;
		justify-content: center;
	}
</style>
