<script lang="ts">
	import type { DataTypes } from '~/lib';

	export let participant: DataTypes['participant'] | undefined = undefined;
	export let stream: MediaStream | undefined;

	$: streamHasVideo = !!stream ? !!stream.getVideoTracks().length : false;
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

{#if streamHasVideo}
	<div class="window">
		<video
			use:srcObject={stream}
			controls={true}
			autoplay
			playsinline
			muted={!streamHasAudio}
		></video>
	</div>
{:else if streamHasAudio}
	<audio
		use:srcObject={stream}
		controls={true}
		autoplay
		playsinline
		muted={false}
	></audio>
{/if}
{#if participant && !streamHasVideo}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{participant.name}
		</h1>
	</div>
{/if}

<style>
	audio {
		display: none;
	}
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
	.window {
		color: white;
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
