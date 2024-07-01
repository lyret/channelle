<script>
	import { api } from '~/api';
	import { currentUser } from '~/stores';
	$: enabled = $api.localMediaStream != undefined;

	function srcObject(node, stream) {
		console.log('local', stream);
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

<section class="card w-full h-full">
	<div class="p-4 space-y-4">
		<h3 class="h3">{$currentUser.name}</h3>
		{#if enabled}
			<!-- svelte-ignore a11y-media-has-caption -->
			<video
				use:srcObject={$api.localMediaStream}
				controls={false}
				autoplay
				playsinline
			></video>
		{:else}
			<div class="placeholder" />
		{/if}
	</div>
</section>
