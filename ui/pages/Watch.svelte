<script lang="ts">
	import LocalMedia from '~/components/watch/LocalMedia.svelte';
	import RemoteMedia from '~/components/watch/RemoteMedia.svelte';
	import Actions from '~/components/watch/Actions.svelte';
	import { createDatabaseStore, createMediaStore } from '~/stores';

	const participants = createDatabaseStore('participant');

	function createLayout(
		matrix: Array<Array<number>>
	): [number, number, Array<Array<number>>] {
		// Determine width and height of the matrix
		const height = Math.max(matrix.length, 1);
		const width = Math.max(matrix.length ? matrix[0].length : 0, 1);

		// Verify that the width is the same for each row
		for (const row of matrix) {
			if (row.length != width) {
				throw new Error('Each row in a layout must be of the same width');
			}
		}

		// Return layout
		return [width, height, matrix];
	}

	const layouts = [
		createLayout([[1, 2, 3]]),
		createLayout([[1, 0, 2]]),
		createLayout([
			[1, 0],
			[2, 4],
		]),
	];
	let selectedLayout = 2;
	$: [width, height, layout] = layouts[selectedLayout];
	function left() {
		if (selectedLayout - 1 < 0) {
			selectedLayout = layouts.length - 1;
			return;
		}
		selectedLayout = selectedLayout - 1;
	}
	function right() {
		if (selectedLayout + 1 == layouts.length) {
			selectedLayout = 0;
			return;
		}
		selectedLayout = selectedLayout + 1;
	}
</script>

<div>
	<div class={`fixed-grid has-${width}-cols`}>
		<div class="grid">
			{#each layout as row}
				{#each row as cell}
					{#if cell}
						<div class="cell has-background-primary">
							w{width}h{height}
						</div>
					{:else}
						<div class="cell">
							w{width}h{height}
						</div>
					{/if}
				{/each}
			{/each}
			<!-- <div>
				<LocalMedia />
			</div>
			<div>
				
			</div> -->
		</div>
	</div>
	<h1 class="title">Remote Media</h1>
	<RemoteMedia />
	<h1 class="title">Local Media</h1>
	<LocalMedia />
	<footer>
		<div class="mt-9">
			<Actions {left} {right} />
		</div>
	</footer>
</div>
