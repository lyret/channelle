<script lang="ts">
	import MediaView from '~/components/watch/MediaView.svelte';
	import ChatView from '~/components/watch/ChatView.svelte';
	import Actions from '~/components/watch/Actions.svelte';
	import { mediaParticipants } from '~/stores/media';

	let muted: boolean = true;

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
		createLayout([[0, 1, 2]]),
		createLayout([[0, 88, 1]]),
		createLayout([
			[0, -1],
			[1, 2],
		]),
	];
	let selectedLayout = 1;
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

<div class="watch-container">
	<div class={`watch-grid cols-${width} rows-${height}`}>
		{#each layout as row}
			{#each row as cell}
				{#if cell == 88}
					<div class="watch-cell">
						<ChatView />
					</div>
				{:else if cell >= 0}
					{#if cell < $mediaParticipants.length}
						<div class="watch-cell">
							<MediaView
								stream={$mediaParticipants[cell].stream}
								participant={$mediaParticipants[cell]}
								{muted}
							/>
						</div>
					{:else}
						<div class="watch-cell">
							<h1 class="title has-text-white">...</h1>
						</div>
					{/if}
				{:else}
					<div class="watch-cell"></div>
				{/if}
			{/each}
		{/each}
	</div>
	<div class="watch-actions">
		<Actions {left} {right} />
	</div>
</div>
{#if muted}
	<div class="watch-overlay">
		<button
			class="button is-large is-dark is-rounded"
			on:click={() => (muted = false)}>Gå in</button
		>
	</div>
{/if}
