<script lang="ts">
	import { peerStreamsStore, sessionsStore } from "~/api/stageNew/roomManager";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { showPeersStore } from "~/api/backstage";

	export let peerId: string;

	// Get reactive values from stores
	$: stream = $peerStreamsStore[peerId];
	$: session = $sessionsStore[peerId];
	$: peer = $showPeersStore[peerId];
	$: isLocalPeer = peerId === $wsPeerIdStore;

	// Simple srcObject directive for video element
	function srcObject(node: HTMLVideoElement, stream: MediaStream | undefined) {
		node.srcObject = stream || null;

		if (stream) {
			node.play().catch(err => {
				console.warn(`[VideoSimple] Autoplay failed for ${peerId}:`, err);
			});
		}

		return {
			update(newStream: MediaStream | undefined) {
				if (node.srcObject !== newStream) {
					node.srcObject = newStream || null;
					if (newStream) {
						node.play().catch(err => {
							console.warn(`[VideoSimple] Autoplay failed for ${peerId}:`, err);
						});
					}
				}
			},
			destroy() {
				node.srcObject = null;
			}
		};
	}
</script>

{#if stream}
	<div class="window">
		<h1 class="title has-text-white">
			{peer?.name || peerId}
		</h1>
		<video
			use:srcObject={stream}
			autoplay
			playsinline
			muted={isLocalPeer}
			controls={false}
		></video>
	</div>
{:else if peer}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{peer.name}
		</h1>
		<p class="has-text-white-ter">
			{#if !session}
				Not in room
			{:else if !peer.online}
				Offline
			{:else}
				No video
			{/if}
		</p>
	</div>
{:else}
	<div class="window text-window">
		<h1 class="title has-text-white">
			Loading...
		</h1>
	</div>
{/if}

<style>
	.window {
		color: var(--channelle-main-bg-color);
		position: relative;
		margin: 0;
		padding: 8px;
		display: block;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	.text-window {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		align-content: center;
		justify-items: center;
		justify-content: center;
	}

	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title {
		position: relative;
		z-index: 1;
		margin-bottom: 0.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
	}
</style>
