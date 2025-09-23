<script lang="ts">
	import { consumersStore } from "~/api/room";

	export let peerId: string;

	$: stream = findStream(peerId);

	function findStream(peerId: string) {
		const consumer = $consumersStore.find((consumer) => consumer.appData.peerId === peerId);
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
