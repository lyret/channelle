<script lang="ts">
	import MediaView from '~/components/watch/MediaView.svelte';
	import MediaAudio from '~/components/watch/MediaAudio.svelte';
	import ChatView from '~/components/watch/ChatView.svelte';
	import Actions from '~/components/watch/ActionBar.svelte';
	import Curtains from '~/components/watch/Curtains.svelte';
	import { createMediaOptionStore, mediaParticipants } from '~/stores/media';

	let notLoaded: boolean = true;
	let muted: boolean = true;

	let curtains = createMediaOptionStore('curtains');
	let layout = createMediaOptionStore('layout');

	$: matrix = $layout || [];
	$: height = Math.max(matrix.length, 1);
	$: width = Math.max(matrix.length ? matrix[0].length : 0, 1);
</script>

{#if $curtains || !notLoaded}
	<!-- CURTAINS -->
	<Curtains />
{:else}
	<!-- WINDOWS, i.e. stage contents -->
	<main>
		<div
			class={`windows window-cols-${width} window-rows-${height}`}
			style={`
			grid-template-columns: repeat(${width}, 1fr);
			grid-template-rows: repeat(${height}, 1fr);
		`}
		>
			{#each matrix as row}
				{#each row as entry}
					{#if entry.type == 'chat'}
						<div class="window">
							<ChatView />
						</div>
					{:else if entry.type == 'actor' && entry.id}
						{#if $mediaParticipants.video[entry.id]}
							<div class="window">
								<MediaView stream={$mediaParticipants.video[entry.id]} />
							</div>
						{:else}
							<div class="window text-window">
								<h1 class="title has-text-white">
									{$mediaParticipants.actors[entry.id]?.name || '...'}
								</h1>
							</div>
						{/if}
					{:else}
						<div class="window"></div>
					{/if}
				{/each}
			{/each}
		</div>
		<div class="footer">
			<Actions />
		</div>
	</main>

	{#each $mediaParticipants.audio as stream}
		<MediaAudio {muted} {stream} />
	{/each}
{/if}

<style>
	main {
		height: 100%;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;
	}

	.footer {
		background-color: black;
		margin: 0;
		padding: 8px;
		width: 100%;
		display: block;
		order: 1;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 1;

		border-top: 1px solid var(--bulma-border);
		z-index: 10;
		box-shadow: 0px -10px 10px black;
	}

	.windows {
		flex-shrink: 0;
		flex-grow: 1;
		flex-basis: 1;
		align-self: auto;

		display: grid;
		order: 0;
		grid-column-gap: 0px;
		grid-row-gap: 0px;
	}

	.window {
		color: white;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 0;
		position: relative;
		margin: 0;
		padding: 8px;
		display: block;
		overflow: none;
		max-height: 100%;
	}

	.text-window {
		width: 100%;
		height: 100%;
		text-align: center;
		display: flex;
		align-items: center;
		align-content: center;
		justify-items: center;
		justify-content: center;
	}
</style>
