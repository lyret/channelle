<script lang="ts">
	import { windowSizeStore } from "~/stores/device";
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import { createEffectsStore } from "~/stores/effects";
	import { stageChatEnabledStore, stageEffectsEnabledStore } from "~/api/media";
	import { showStageChatStore, showStageStettingsStore } from "~/stores/stage";
	import { windowFullscreenStore } from "~/stores/device";
	import IconMaximize from "../../icons/Icon-maximize.svelte";
	import IconMessageCircle from "../../icons/Icon-message-circle.svelte";
	import IconMinimize from "../../icons/Icon-minimize.svelte";
	import IconToggleLeft from "../../icons/Icon-toggle-left.svelte";
	import IconToggleRight from "../../icons/Icon-toggle-right.svelte";
	import CameraControls from "./_CameraControls.svelte";
	import StageDirections from "./_StageDirections.svelte";
	import MicrophoneControls from "./_MicrophoneControls.svelte";

	const fullscreen = windowFullscreenStore();
	const windowSize = windowSizeStore();
	$: isMobile = $windowSize.width <= 842;
	const effects = createEffectsStore();

	// Make sure effects are rendered
	onMount(() => {
		const stop = effects.subscribe(() => {});

		return () => {
			stop();
		};
	});

	// Class list of all buttons in the action bar
	const btnClassList = "button is-small";
	const effectBtnClassList = "button effect is-small is-danger is-rounded is-light is-outlined is-warning";
	const iconClassList = "icon is-size-4";
</script>

<div class="bar" style={`flex-wrap: ${isMobile ? "wrap" : "nowrap"};`}>
	<!-- STATUS -->
	<span class="block"><StageDirections /></span>
	<!-- SPACER / BREAKER -->
	{#if !isMobile}
		<div class="spacer" />
	{:else}
		<div class="breaker" />
	{/if}
	<!-- EFFECTS -->
	{#if $stageEffectsEnabledStore}
		<button class={effectBtnClassList} transition:blur on:click={() => effects.set({ type: "applause", number: 1 })}>
			<span class={iconClassList}>👏</span></button
		>
		<button class={effectBtnClassList} transition:blur on:click={() => effects.set({ type: "flowers", number: 1 })}>
			<span class={iconClassList}>🌹</span></button
		>
		{#if !isMobile}
			<div class="spacer" />
		{/if}
	{/if}
	<!-- VIDEO -->
	<CameraControls minimal={isMobile} />

	<!-- AUDIO -->
	<MicrophoneControls minimal={isMobile} />
	<!-- FULLSCREEN -->
	<button
		type="button"
		class={btnClassList + " is-hidden-mobile"}
		class:active={$fullscreen}
		transition:blur
		on:click={() => {
			fullscreen.toggle();
		}}
	>
		{#if $fullscreen}
			<span class={iconClassList}><IconMinimize /></span>
		{:else}
			<span class={iconClassList}><IconMaximize /></span>
		{/if}
	</button>
	<!-- CHAT -->
	{#if $stageChatEnabledStore}
		<button
			class={btnClassList}
			transition:blur
			class:active={$showStageChatStore}
			on:click={() => {
				showStageChatStore.set(!$showStageChatStore);
				showStageStettingsStore.set(false);
			}}
		>
			<span class={iconClassList}><IconMessageCircle /></span>
			{#if !isMobile}
				<span>Chat</span>
			{/if}
		</button>
	{/if}
	<!-- STAGE SETTINGS -->
	<button
		class={btnClassList}
		transition:blur
		class:active={$showStageStettingsStore}
		on:click={() => {
			showStageStettingsStore.set(!$showStageStettingsStore);
			showStageChatStore.set(false);
		}}
	>
		<span class={iconClassList}>
			{#if $showStageStettingsStore}
				<IconToggleRight />
			{:else}
				<IconToggleLeft />
			{/if}
		</span>
		{#if !isMobile}
			<span>Alternativ</span>
		{/if}
	</button>
</div>

<style lang="scss">
	.bar {
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		height: 48px;
	}
	.block {
		text-align: center;
	}
	.spacer {
		flex-grow: 0.4;
	}
	.breaker {
		flex-basis: 100%;
		height: 0;
	}

	.button {
		border-radius: 0;
		border: none;
		padding: 12px;
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
	}
	.button.active {
		font-weight: 900;
		font-size: 1.1em;
	}
	.button.effect {
		width: 50px;
	}
</style>
