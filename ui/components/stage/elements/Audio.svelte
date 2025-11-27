<script lang="ts">
	import { peerStreamsStore, sessionsStore } from "~/api/stageNew/roomManager";
	import { wsPeerIdStore } from "~/api/_trpcClient";

	export let peerId: string;

	// Get reactive values from stores
	$: stream = $peerStreamsStore[peerId];
	$: session = $sessionsStore[peerId];
	$: isLocalPeer = peerId === $wsPeerIdStore;

	// Check if stream has audio
	$: hasAudio = stream?.getAudioTracks().length > 0;

	// Simple srcObject directive for audio element
	function srcObject(node: HTMLAudioElement, stream: MediaStream | undefined) {
		node.srcObject = stream || null;

		if (stream) {
			node.play().catch((err) => {
				console.warn(`[AudioSimple] Autoplay failed for ${peerId}:`, err);
			});
		}

		return {
			update(newStream: MediaStream | undefined) {
				if (node.srcObject !== newStream) {
					node.srcObject = newStream || null;
					if (newStream) {
						node.play().catch((err) => {
							console.warn(`[AudioSimple] Autoplay failed for ${peerId}:`, err);
						});
					}
				}
			},
			destroy() {
				node.srcObject = null;
			},
		};
	}
</script>

<!-- Only render audio element if stream has audio and it's not the local peer -->
{#if stream && hasAudio && !isLocalPeer}
	<audio use:srcObject={stream} autoplay playsinline controls={false}></audio>
{/if}

<style>
	audio {
		display: none;
	}
</style>
