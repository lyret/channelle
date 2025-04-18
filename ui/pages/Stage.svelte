<script lang="ts">
	import { onMount } from "svelte";
	import { blur, fly } from "svelte/transition";
	import ActionPanel from "~/components/stage/ActionPanel.svelte";
	import ChatPanel from "~/components/stage/ChatPanel.svelte";
	import ChatWindow from "~/components/stage/ChatWindow.svelte";
	import MediaAudio from "~/components/stage/MediaAudio.svelte";
	import MediaWindow from "~/components/stage/MediaWindow.svelte";
	import OptionsPanel from "~/components/stage/OptionsPanel.svelte";
	import { StageAudio } from "~/lib/stores/stageAudio";
	import { StageLayout } from "~/lib/stores/stageLayout";
	import { stageChat } from "~/stores/scene/stageChatPanelsOpen";
	import { stageSettings } from "~/stores/scene/stageSettingsIsOpen";

	$: matrix = $StageLayout.layout || [];
	$: height = Math.max(matrix.length, 1);
	$: width = Math.max(matrix.length ? matrix[0].length : 0, 1);

	$: windowsLayoutStyle = $StageLayout.isAutoLayout
		? `
		 grid-template-columns: repeat(auto-fit, minmax(50%, auto));
	`
		: `
			grid-template-columns: repeat(${width}, 1fr);
			grid-template-rows: repeat(${height}, 1fr);
		`;

	onMount(() => {
		StageLayout.subscribe((data) => {
			console.log("StageLayout", data);
		});
	});
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<div class="contents">
		<div class="windows-wrapper">
			<div
				class={`windows window-cols-${width} window-rows-${height}`}
				style={windowsLayoutStyle}
			>
				{#if $StageLayout.isAutoLayout}
					{#each $StageLayout.leftovers as cell}
						{#key cell.id}
							<MediaWindow
								stream={cell.stream}
								participant={cell.participant}
							/>
						{/key}
					{/each}
				{:else}
					{#each matrix as row}
						{#each row as cell}
							{#if cell.type == "chat"}
								<div class="window">
									<ChatWindow />
								</div>
							{:else if cell.type == "actor"}
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
		{#if $stageSettings || $stageChat}
			<div class="sidebar">
				<div
					class="sidebar-contents"
					style="z-index: 9999"
					in:fly={{ y: 200 }}
					out:fly={{ y: 200 }}
				>
					{#if $stageSettings}
						<OptionsPanel />
					{:else}
						<ChatPanel />
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- AUDIO ELEMENTS -->
	{#each $StageAudio.audio as cell}
		{#key cell.id}
			<MediaAudio stream={cell.stream} />
		{/key}
	{/each}

	<!-- FOOTER -->
	<div class="footer">
		<ActionPanel />
	</div>
</main>

<style lang="scss">
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
		min-width: 400px;
		max-width: 600px;
		max-height: 100%;
		overflow: hidden;

		display: flex;
		flex-direction: column;
		align-items: end;
		justify-items: end;
		padding: 4px;

		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);

		@include mobile {
			position: fixed;
			order: 0;
			max-width: unset;
			width: 100%;
			top: 0;
			left: 0;
			right: 0;
			bottom: 120px;
		}
	}

	.sidebar-contents {
		position: absolute;
		top: clamp(8px, auto, 8px);
		max-height: 100%;
		height: 100%;
		margin-top: 8px;
		left: 8px;
		right: 8px;
		bottom: 12px;
		overflow-y: scroll;
		z-index: 100;
		-webkit-backdrop-filter: blur(10px);
		backdrop-filter: blur(10px);
	}

	.footer {
		background-color: var(--channelle-main-bg-color);
		margin: 0;
		padding: 8px 0px;
		width: 100%;
		height: 60px;

		display: block;
		order: 1;
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 0px;

		/*border-top: 1px solid var(--bulma-border);*/
		z-index: 9999;
		box-shadow: 0px -10px 10px rgba(var(--bulma-body-background-color), 0.8);

		@include mobile {
			height: 120px;
		}
	}

	.windows-wrapper {
		flex-shrink: 0;
		flex-grow: 1;
		flex-basis: 1;
		align-self: auto;
		order: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.windows {
		display: grid;
		width: 100%;
		position: relative;
		max-width: calc(((100vh - 60px) / 10) * 16);

		aspect-ratio: 16/10;
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		@include mobile {
			max-width: calc(((100vh - 120px) / 10) * 16);
		}
	}

	.window {
		color: var(--channelle-main-bg-color);
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
