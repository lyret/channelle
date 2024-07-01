<script>
	import { api } from '~/api';

	export let streamNr = 1;

	$: mediaStream =
		$api.remoteMediaStreams.length >= streamNr
			? $api.remoteMediaStreams[streamNr - 1]
			: undefined;

	function srcObject(node, stream) {
		console.log('remote', stream);
		node.srcObject = stream;
		return {
			update(newStream) {
				if (node.srcObject != newStream) {
					node.srcObject = newStream;
				}
			},
		};
	}
</script>

<section
	class="card variant-filled w-full h-full flex items-center justify-center"
>
	{#if mediaStream}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video use:srcObject={mediaStream} controls={true} autoplay playsinline
		></video>
	{:else}
		<h3 class="h3">no {streamNr} streamer</h3>
	{/if}
</section>

<style lang="postcss">
	video {
		width: 100%;
		border-radius: 8px;
	}
</style>
