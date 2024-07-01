<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import Icon from '~/tokens/icon.svelte';
	import { api, ConnectionStatus } from '~/api';
	import LocalMedia from '~/components/localMedia.svelte';
	import RemoteMedia from '~/components/remoteMedia.svelte';
	import Controls from '~/components/controls.svelte';

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

<div class="flex flex-col h-screen justify-between">
	{#if $api.status.connection == ConnectionStatus.Connected}
		<main class="flex-grow">
			<div
				class={`grid grid-cols-${width} grid-rows-${height} gap-2 m-2 h-full`}
			>
				{#each layout as row}
					{#each row as cell}
						{#if cell}
							<div class="card variant-ghost w-full h-full">
								w{width}h{height}
							</div>
						{:else}
							<div class="card variant-ghost w-full h-full">
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
		</main>
		<footer class="fixed bottom-0 w-screen">
			<div class="mx-10 my-1 text-center">
				<Controls {left} {right} />
			</div>
		</footer>
	{:else}
		<div
			class="w-full h-full flex items-center justify-center text-error-500 font-bold text-center"
		>
			{#if $api.status.connection == ConnectionStatus.Failed}
				<p class="h1">
					<Icon size={12} name="i-majesticons-skull" /><br />
					Ingen anslutning<br />
					<span class="h3">(unable to connect)</span>
				</p>
			{:else}
				<ProgressRadial
					stroke={70}
					strokeLinecap="round"
					track=""
					meter="stroke-primary-500"
				/>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss"></style>
