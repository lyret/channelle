<script lang="ts">
	export let muted: boolean = true;
	export let stream: MediaStream;

	$: streamHasAudio = stream && stream.getAudioTracks().length;

	function srcObject(node: any, stream: any) {
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
		class="watch-audio"
		use:srcObject={stream}
		controls={false}
		autoplay
		playsinline
		{muted}
	></audio>
{/if}
