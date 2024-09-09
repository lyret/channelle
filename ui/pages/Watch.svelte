<script lang="ts">
	import { slide } from 'svelte/transition';
	import MediaView from '~/components/watch/MediaView.svelte';
	import MediaAudio from '~/components/watch/MediaAudio.svelte';
	import ChatView from '~/components/watch/ChatView.svelte';
	import Actions from '~/components/watch/Actions.svelte';
	import { createMediaOptionStore, mediaParticipants } from '~/stores/media';
	import curtainsSrc from '../assets/images/curtains.jpg';

	let muted: boolean = true;

	let curtains = createMediaOptionStore('curtains');
	let layout = createMediaOptionStore('layout');

	$: matrix = $layout || [];
	$: height = Math.max(matrix.length, 1);
	$: width = Math.max(matrix.length ? matrix[0].length : 0, 1);
</script>

<!-- Make sure the curtain image is preloaded -->
<svelte:head>
	<link rel="preload" as="image" href={curtainsSrc} />
</svelte:head>

<div class="watch-container">
	<div class={`watch-grid cols-${width} rows-${height}`}>
		{#each matrix as row}
			{#each row as entry}
				{#if entry.type == 'chat'}
					<div class="watch-cell">
						<ChatView />
					</div>
				{:else if entry.type == 'actor' && entry.id}
					{#if $mediaParticipants.video[entry.id]}
						<div class="watch-cell">
							<MediaView stream={$mediaParticipants.video[entry.id]} />
						</div>
					{:else}
						<div class="watch-cell">
							<h1 class="title has-text-white">
								{$mediaParticipants.actors[entry.id]?.name || '...'}
							</h1>
						</div>
					{/if}
				{:else}
					<div class="watch-cell"></div>
				{/if}
			{/each}
		{/each}
	</div>
	<div class="watch-actions">
		<Actions />
	</div>
	{#if $curtains}
		<!-- svelte-ignore a11y-missing-attribute -->
		<img
			class="watch-curtains"
			src={curtainsSrc}
			transition:slide={{ axis: 'y' }}
		/>
	{/if}
</div>

{#each $mediaParticipants.audio as stream}
	<MediaAudio {muted} {stream} />
{/each}

{#if muted}
	<div class="watch-overlay">
		<button
			class="button is-large is-dark is-rounded"
			on:click={() => (muted = false)}>Gå in</button
		>
	</div>
{/if}
