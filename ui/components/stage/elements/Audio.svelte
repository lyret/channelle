<script lang="ts">
	import { consumersStore, sessionsStore, subscribeToTrack } from "~/api/stage";

	export let peerId: string;

	$: session = $sessionsStore[peerId];
	$: stream = findStream(peerId);

	// Check if peer has audio available and we don't have a consumer for it
	$: hasAudioAvailable = session && session.media && session.media["mic-audio"];
	$: hasAudioConsumer = $consumersStore.find((consumer) => consumer.appData.peerId === peerId && consumer.appData.mediaTag === "mic-audio");

	// Auto-subscribe to audio track when peer has audio but we don't have a consumer
	$: {
		if (hasAudioAvailable && !hasAudioConsumer) {
			console.log(`[Audio] Auto-subscribing to audio track for peer ${peerId}`);
			subscribeToTrack(peerId, "mic-audio").catch((error) => {
				console.error(`[Audio] Failed to subscribe to audio track for peer ${peerId}:`, error);
			});
		}
	}

	function findStream(peerId: string) {
		const consumer = $consumersStore.find((consumer) => consumer.appData.peerId === peerId && consumer.appData.mediaTag === "mic-audio");
		if (consumer) {
			return new MediaStream([consumer.track]);
		}
		return undefined;
	}

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

{#if streamHasAudio}
	<audio use:srcObject={stream} controls={true} autoplay playsinline muted={false}></audio>
{/if}

<style>
	audio {
		display: none;
	}
</style>
