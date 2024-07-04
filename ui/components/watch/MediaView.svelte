<script lang="ts">
	import type { DataTypes } from '~/api';

	export let muted: boolean = true;
	export let stream: MediaStream;
	export let participant: DataTypes['participant'];

	$: streamHasVideo = stream && stream.getVideoTracks().length;
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

{#if streamHasVideo}
	<video
		class="watch-video"
		use:srcObject={stream}
		controls={false}
		autoplay
		playsinline
		{muted}
	></video>
{:else}
	<h1 class="title has-text-centered has-text-white">
		{participant.name}
	</h1>
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
{/if}
