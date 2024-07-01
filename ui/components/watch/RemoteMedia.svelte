<script lang="ts">
	import { media } from '~/stores/media';

	export let streamNr = 1;

	$: mediaStream =
		$media.remoteMediaStreams.length >= streamNr
			? $media.remoteMediaStreams[streamNr - 1]
			: undefined;

	function srcObject(node: any, stream: any) {
		console.log('remote', stream);
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

<div class="card">
	{#if mediaStream}
		<div class="card-image">
			<figure class="image is-4by3">
				<video use:srcObject={mediaStream} controls={true} autoplay playsinline
				></video>
			</figure>
		</div>
	{:else}
		<h3 class="has-size-3">no {streamNr} streamer</h3>
	{/if}
</div>

<style>
	video {
		width: 100%;
		border-radius: 8px;
	}
</style>
