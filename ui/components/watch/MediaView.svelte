<script lang="ts">
	import type { DataTypes } from '~/api';

	export let stream: MediaStream;
	export let participant: DataTypes['participant'];

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

<div class="card">
	<h3 class="title is-size-3">{participant.name}</h3>
	<div class="card-image">
		<figure class="image is-4by3">
			<video use:srcObject={stream} controls={true} autoplay playsinline
			></video>
		</figure>
	</div>
</div>

<style>
	video {
		width: 100%;
		border-radius: 8px;
	}
</style>
