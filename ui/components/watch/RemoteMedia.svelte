<script lang="ts">
	import { createMediaStore } from '~/stores';

	const remoteStreams = createMediaStore('remoteMediaStreams');

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

{#each $remoteStreams as mediaStream}
	<div class="card">
		{#if mediaStream}
			<div class="card-image">
				<figure class="image is-4by3">
					<video
						use:srcObject={mediaStream}
						controls={true}
						autoplay
						playsinline
					></video>
				</figure>
			</div>
		{:else}
			<h3 class="has-size-3"></h3>
		{/if}
	</div>
{/each}

<style>
	video {
		width: 100%;
		border-radius: 8px;
	}
</style>
