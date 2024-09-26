<script lang="ts">
	export let stream: MediaStream | undefined;
	$: streamHasVideo = stream && stream.getVideoTracks().length;

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

{#if streamHasVideo}
	<video
		use:srcObject={stream}
		controls={false}
		autoplay
		playsinline
		muted={true}
	></video>
{/if}

<style>
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
