<script lang="ts">
	export let stream: MediaStream | undefined;

	$: streamHasAudio = !!stream ? !!stream.getAudioTracks().length : false;

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
	<audio
		use:srcObject={stream}
		controls={true}
		autoplay
		playsinline
		muted={false}
	></audio>
{/if}

<style>
	audio {
		display: none;
	}
</style>
