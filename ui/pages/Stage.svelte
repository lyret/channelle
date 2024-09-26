<script lang="ts">
	import Sidepanel from '~/components/stage/Sidepanel.svelte';
	import MediaView from '~/components/stage/MediaView.svelte';
	import MediaAudio from '~/components/stage/MediaAudio.svelte';
	import ChatView from '~/components/stage/ChatWindow.svelte';
	import Actions from '~/components/stage/ActionBar.svelte';
	import { createMediaOptionStore, mediaParticipants } from '~/stores/media';
	import { blur, fly } from 'svelte/transition';
	import { createLocalStore } from '~/stores';

	let stageSettings = createLocalStore('stage-settings', false);
	let layout = createMediaOptionStore('layout');

	$: matrix = $layout || [];
	$: height = Math.max(matrix.length, 1);
	$: width = Math.max(matrix.length ? matrix[0].length : 0, 1);
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<div class="topbar has-text-info has-text-weight-bold">
		<span class="icon is-size-4"><ion-icon name="eye"></ion-icon></span>
		<span class="is-size-4">&nbsp;Du syns i bild</span>
		<span class="icon is-size-4"
			><ion-icon name="volume-medium"></ion-icon></span
		>
		<span class="is-size-4">&nbsp;Du hörs</span>
	</div>
	<div class="contents">
		{#if $stageSettings}
			<div class="sidebar">
				<div class="notification sidebar-contents" transition:fly>
					<Sidepanel />
				</div>
			</div>
		{/if}
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
	</div>
	<div class="footer">
		<Actions />
	</div>
</main>

{#each $mediaParticipants.audio as stream}
	<MediaAudio {stream} />
{/each}

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
	.contents {
		flex-shrink: 1;
		flex-grow: 1;
		flex-basis: 1;
		align-self: auto;

		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: normal;
		align-items: normal;
		align-content: normal;

		width: auto;
		transition: width 2s;
	}

	.sidebar {
		flex-shrink: 1;
		overflow: hidden;
		position: relative;
		order: 2;
		width: 30%;
		min-width: 300px;
		max-width: 600px;
		max-height: 100%;
		overflow: hidden;

		display: flex;
		flex-direction: column;
		align-items: end;
		justify-items: end;
		padding: 4px;
	}

	.sidebar-contents {
		position: absolute;
		top: 8px;
		left: 8px;
		right: 8px;
		bottom: 8px;
		overflow-y: scroll;
		z-index: 100;
		background-color: hsla(
			var(--bulma-notification-h),
			var(--bulma-notification-s),
			var(--bulma-notification-background-l),
			0.8
		);
		-webkit-backdrop-filter: blur(10px);
		backdrop-filter: blur(10px);
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

		/*border-top: 1px solid var(--bulma-border);*/
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

	.topbar {
		margin: 0;
		display: flex;
		align-content: center;
		align-items: center;
		justify-content: center;
		justify-items: center;
		background-color: black;
		border-radius: 0;
		border-bottom: 1px solid var(--bulma-border);
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
