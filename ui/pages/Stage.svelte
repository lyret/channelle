<script lang="ts">
	import { onMount } from 'svelte';
	import { blur, fly } from 'svelte/transition';
	import MediaWindow from '~/components/stage/MediaWindow.svelte';
	import ChatWindow from '~/components/stage/ChatWindow.svelte';
	import MenuPanel from '~/components/stage/MenuPanel.svelte';
	import ActionPanel from '~/components/stage/ActionPanel.svelte';
	import { MediaStore } from '~/lib/stores/media';
	import { stageSettings } from '~/stores/scene/stageSettingsIsEnbaled';

	$: matrix = $MediaStore.layout || [];
	$: height = Math.max(matrix.length, 1);
	$: width = Math.max(matrix.length ? matrix[0].length : 0, 1);

	$: windowsLayoutStyle = $MediaStore.isAutoLayout
		? `
		 grid-template-columns: repeat(auto-fit, minmax(600px, auto));
	`
		: `
			grid-template-columns: repeat(${width}, 1fr);
			grid-template-rows: repeat(${height}, 1fr);
		`;

	onMount(() => {
		MediaStore.subscribe((data) => {
			console.log('MEDIA STORE', data);
		});
	});
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<div class="contents">
		{#if $stageSettings}
			<div class="sidebar">
				<div class="notification sidebar-contents" transition:fly>
					<MenuPanel />
				</div>
			</div>
		{/if}
		<div
			class={`windows window-cols-${width} window-rows-${height}`}
			style={windowsLayoutStyle}
		>
			{#if $MediaStore.isAutoLayout}
				{#each $MediaStore.leftovers as cell}
					{#key cell.id}
						<MediaWindow stream={cell.stream} participant={cell.participant} />
					{/key}
				{/each}
			{:else}
				{#each matrix as row}
					{#each row as cell}
						{#if cell.type == 'chat'}
							<div class="window">
								<ChatWindow />
							</div>
						{:else if cell.type == 'actor'}
							<MediaWindow
								stream={cell.stream}
								participant={cell.participant}
							/>
						{:else}
							<div class="window"></div>
						{/if}
					{/each}
				{/each}
			{/if}
		</div>
	</div>
	<div class="footer">
		<ActionPanel />
	</div>
</main>

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
</style>
