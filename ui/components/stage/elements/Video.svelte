<script lang="ts">
	import { peerStreamsStore, sessionsStore } from "~/api/stageNew";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { showPeersStore } from "~/api/backstage";
	import { DebugPanel } from "~/components/debug";
	import { debugModeStore } from "~/stores/debugMode";

	export let peerId: string;

	// Get reactive values from stores
	$: stream = $peerStreamsStore[peerId];
	$: session = $sessionsStore[peerId];
	$: peer = $showPeersStore[peerId];
	$: myPeerId = $wsPeerIdStore;
	$: isLocalPeer = peerId === myPeerId;

	// Check stream status
	$: streamHasVideo = stream?.getVideoTracks().length > 0;
	$: streamHasAudio = stream?.getAudioTracks().length > 0;

	// Simple srcObject directive for video element
	function srcObject(node: HTMLVideoElement, stream: MediaStream | undefined) {
		let playPromise: Promise<void> | null = null;

		const tryPlay = () => {
			// Cancel any pending play promise
			playPromise = null;

			// Only try to play if we have a stream and the element is ready
			if (node.srcObject && node.readyState >= 2) {
				playPromise = node.play().catch((err) => {
					// Only log if it's not an interruption error
					if (!err.message.includes("interrupted")) {
						console.warn(`[Video] Autoplay failed for ${peerId}:`, err);
					}
				});
			}
		};

		node.srcObject = stream || null;

		if (stream) {
			// Wait for loadedmetadata event before trying to play
			node.addEventListener("loadedmetadata", tryPlay, { once: true });
			// Also try playing if already loaded
			if (node.readyState >= 2) {
				tryPlay();
			}
		}

		return {
			update(newStream: MediaStream | undefined) {
				if (node.srcObject !== newStream) {
					// Cancel any pending play promise before changing source
					playPromise = null;

					node.srcObject = newStream || null;
					if (newStream) {
						// Wait for loadedmetadata event before trying to play
						node.addEventListener("loadedmetadata", tryPlay, { once: true });
						// Also try playing if already loaded
						if (node.readyState >= 2) {
							tryPlay();
						}
					}
				}
			},
			destroy() {
				playPromise = null;
				node.srcObject = null;
			},
		};
	}
</script>

{#if peer && !stream}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{peer.name}
		</h1>
		{#if $debugModeStore}
			<DebugPanel {peerId} compact={true} />
			<div class="debug-info">
				<small>
					No Stream | Online: {peer?.online} | Session: {!!session}
				</small>
			</div>
		{/if}
	</div>
{:else if stream}
	<div class="window">
		<h1 class="title has-text-white">
			{peer?.name}
		</h1>
		<video use:srcObject={stream} controls={false} autoplay={true} playsinline={true} muted={isLocalPeer || !streamHasAudio}></video>
		{#if $debugModeStore}
			<DebugPanel {peerId} compact={true} />
			<div class="debug-info">
				<small>
					Stream: {stream.id?.slice(-8)} | Tracks: V:{streamHasVideo ? "✓" : "✗"} A:{streamHasAudio ? "✓" : "✗"} | Local: {isLocalPeer ? "Yes" : "No"}
				</small>
			</div>
		{/if}
	</div>
{:else}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{peer?.name || "Waiting..."}
		</h1>
		{#if $debugModeStore}
			<DebugPanel {peerId} compact={true} />
			<div class="debug-info">
				<small>No Peer Data | ID: {peerId}</small>
			</div>
		{/if}
	</div>
{/if}

<style>
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.window {
		color: var(--channelle-main-bg-color);
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 0;
		position: relative;
		margin: 0;
		padding: 8px;
		display: block;
		overflow: hidden;
		max-height: 100%;
		width: 100%;
		height: 100%;
	}

	.text-window {
		width: 100%;
		height: 100%;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		align-content: center;
		justify-items: center;
		justify-content: center;
	}

	.title {
		position: relative;
		z-index: 1;
		margin-bottom: 0.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
	}

	.debug-info {
		position: absolute;
		bottom: 4px;
		left: 4px;
		right: 4px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 4px;
		font-size: 10px;
		border-radius: 2px;
		z-index: 10;
		text-align: left;
	}
</style>
