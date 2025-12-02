<script lang="ts">
	import { blur, fly } from "svelte/transition";

	import Wrapper from "./_Wrapper.svelte";
	import ActionBar from "~/components/stage/bottom/ActionBar.svelte";
	import ChatSidepanel from "~/components/stage/sidepanel/ChatSidePanel.svelte";
	import OptionsSidePanel from "~/components/stage/sidepanel/OptionsSidePanel.svelte";
	import StageChat from "~/components/stage/elements/Chat.svelte";
	import Audio from "~/components/stage/elements/Audio.svelte";
	import Video from "~/components/stage/elements/Video.svelte";

	import { calculatedStageLayoutStore } from "~/stores/stage";
	import { showStageChatStore, showStageSettingsStore } from "~/stores/stage";

	// Layout calculations
	$: matrix = $calculatedStageLayoutStore.layout || [];
	$: height = Math.max(matrix.length, 1);
	$: width = Math.max(matrix.length ? matrix[0].length : 0, 1);

	$: windowsLayoutStyle = $calculatedStageLayoutStore.isAutoLayout
		? `
		 grid-template-columns: repeat(auto-fit, minmax(50%, auto));
	`
		: `
			grid-template-columns: repeat(${width}, 1fr);
			grid-template-rows: repeat(${height}, 1fr);
		`;
</script>

<Wrapper lockedToInviteKey={true}>
	<main in:blur={{ delay: 500, duration: 1000 }}>
		<div class="contents">
			<div class="windows-wrapper">
				<div class={`windows window-cols-${width} window-rows-${height}`} style={windowsLayoutStyle}>
					{#if $calculatedStageLayoutStore.isAutoLayout}
						{#if $calculatedStageLayoutStore.videoLeftovers.length > 0}
							{#each $calculatedStageLayoutStore.videoLeftovers as cell (cell.peerId)}
								<Video peerId={cell.peerId} />
							{/each}
						{:else}
							<div class="window empty-window"></div>
						{/if}
					{:else}
						{#each matrix as row, rowIndex (rowIndex)}
							{#each row as cell, cellIndex (`${rowIndex}-${cellIndex}`)}
								{#if cell.type == "chat"}
									<div class="window">
										<StageChat />
									</div>
								{:else if cell.type == "actor"}
									<Video peerId={cell.peerId} />
								{:else}
									<div class="window"></div>
								{/if}
							{/each}
						{/each}
					{/if}
				</div>
			</div>

			{#if $showStageSettingsStore || $showStageChatStore}
				<div class="sidebar">
					<div class="sidebar-contents" style="z-index: 9999" in:fly={{ y: 200 }} out:fly={{ y: 200 }}>
						{#if $showStageSettingsStore}
							<OptionsSidePanel />
						{:else}
							<ChatSidepanel />
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- AUDIO ELEMENTS -->
		<!-- Audio is now handled internally by AudioSimple component via peerStreamsStore -->
		{#each $calculatedStageLayoutStore.audioLeftovers as cell (cell.peerId)}
			<Audio peerId={cell.peerId} />
		{/each}

		<!-- FOOTER -->
		<div class="footer">
			<ActionBar />
		</div>
	</main>
</Wrapper>

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

		@include mobile {
			position: fixed;
			order: 0;
			min-width: unset;
			max-width: unset;
			width: 100%;
			top: 0;
			left: 0;
			right: 0;
			bottom: 64px;
			z-index: 10000;
		}
	}

	.sidebar-contents {
		position: absolute;
		top: clamp(8px, auto, 8px);
		max-height: 100%;
		height: auto;
		left: 0px;
		right: 0px;
		bottom: 0px;
		padding: 8px;
		overflow-y: scroll;
		z-index: 100;
		-webkit-backdrop-filter: blur(10px);
		backdrop-filter: blur(10px);
		background-color: rgba(var(--bulma-scheme-main-rgb), 0.85);
		color: var(--channelle-menu-text-color);
	}

	.footer {
		background-color: rgba(var(--bulma-scheme-main-rgb), 0.85);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
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
		position: relative;
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

	.empty-window {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	.notification {
		position: relative;
		z-index: 1000;
	}

	.loader {
		display: inline-block;
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s ease-in-out infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
