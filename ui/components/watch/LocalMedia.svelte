<script lang="ts">
	import { currentParticipant } from '~/stores/connection';
	import { createMediaStore } from '~/stores';
	const localStream = createMediaStore('localMediaStream');
	$: enabled = $localStream != undefined;

	function srcObject(node: any, stream: any) {
		console.log('local', stream);
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
	<div class="p-4 space-y-4">
		<h3 class="is-size-3">{$currentParticipant.name}</h3>
		<div class="card-image">
			<figure class="image is-4by3">
				{#if enabled}
					<!-- svelte-ignore a11y-media-has-caption -->
					<video
						use:srcObject={$localStream}
						controls={false}
						autoplay
						playsinline
					></video>
				{/if}
			</figure>
		</div>
	</div>
</div>

<style>
	video {
		width: 100%;
		border-radius: 8px;
	}
</style>
