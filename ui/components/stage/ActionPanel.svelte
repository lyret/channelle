<script lang="ts">
	import { windowSizeStore } from '$ui/device';
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { createEffectsStore } from '~/stores/particles/effectsStore';
	import { sceneChatIsEnabled } from '~/stores/scene/sceneChatIsEnabled';
	import { sceneEffectsIsEnabled } from '~/stores/scene/sceneEffectsIsEnabled';
	import { stageChat } from '~/stores/scene/stageChatPanelsOpen';
	import { stageSettings } from '~/stores/scene/stageSettingsIsOpen';
	import { fullscreenStore } from '~/stores/ui/fullscreen';
	import IconMaximize from '../icons/Icon-maximize.svelte';
	import IconMessageCircle from '../icons/Icon-message-circle.svelte';
	import IconMinimize from '../icons/Icon-minimize.svelte';
	import IconToggleLeft from '../icons/Icon-toggle-left.svelte';
	import IconToggleRight from '../icons/Icon-toggle-right.svelte';
	import CameraActionButton from './actionButtons/CameraActionButton.svelte';
	import MediaInputStatus from './actionButtons/MediaInputStatus.svelte';
	import MicrophoneActionButton from './actionButtons/MicrophoneActionButton.svelte';

	const fullscreen = fullscreenStore();
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
	const btnClassList = 'button is-small';
	const effectBtnClassList =
		'button effect is-small is-danger is-rounded is-light is-outlined is-warning';
	const iconClassList = 'icon is-size-4';
</script>

<div class="bar" style={`flex-wrap: ${isMobile ? 'wrap' : 'nowrap'};`}>
	<!-- STATUS -->
	<span class="block"><MediaInputStatus /></span>
	<!-- SPACER / BREAKER -->
	{#if !isMobile}
		<div class="spacer" />
	{:else}
		<div class="breaker" />
	{/if}
	<!-- EFFECTS -->
	{#if $sceneEffectsIsEnabled}
		<button
			class={effectBtnClassList}
			transition:blur
			on:click={() => effects.set({ type: 'applause', number: 1 })}
		>
			<span class={iconClassList}>👏</span></button
		>
		<button
			class={effectBtnClassList}
			transition:blur
			on:click={() => effects.set({ type: 'flowers', number: 1 })}
		>
			<span class={iconClassList}>🌹</span></button
		>
		{#if !isMobile}
			<div class="spacer" />
		{/if}
	{/if}
	<!-- VIDEO -->
	<CameraActionButton minimal={isMobile} />

	<!-- AUDIO -->
	<MicrophoneActionButton minimal={isMobile} />
	<!-- FULLSCREEN -->
	<button
		type="button"
		class={btnClassList + ' is-hidden-mobile'}
		transition:blur
		on:click = {() => {
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
	{#if $sceneChatIsEnabled}
		<button
			class={btnClassList}
			transition:blur
			class:has-text-success={$stageChat}
			class:has-text-light={$stageChat}
			on:click={() => stageChat.set(!$stageChat)}
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
		class:has-text-info={$stageSettings}
		on:click={() => stageSettings.set(!$stageSettings)}
	>
		<span class={iconClassList}>
			{#if $stageSettings}
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
	.spacer {
		flex-grow: 0.4;
	}
	.breaker {
		flex-basis: 100%;
		height: 0;
	}

	.button {
		background-color: black;
		border: 1px solid var(--bulma-border);
	}
	.button.effect {
		width: 50px;
	}
	.button:hover {
		border: 1px solid var(--bulma-border);
	}
</style>
