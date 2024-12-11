<script lang="ts">
	import { windowSizeStore } from '$ui/device';
	import { fullScreenAction } from '~/legos/actions/fullScreenAction';
	import { isInFullscreen } from '~/legos/stores/fullscreenStore';
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { currentParticipant } from '~/lib/stores/api';
	import { createEffectsStore } from '~/stores/particles/effectsStore';
	import { sceneEffectsIsEnabled } from '~/stores/scene/sceneEffectsIsEnabled';
	import { stageSettings } from '~/stores/scene/stageSettingsIsOpen';
	import CameraActionButton from './actionButtons/CameraActionButton.svelte';
	import MicrophoneActionButton from './actionButtons/MicrophoneActionButton.svelte';
	import MediaInputStatus from './actionButtons/MediaInputStatus.svelte';
	let windowSize = windowSizeStore();
	$: isMobile = $windowSize.width <= 842;
	import { sceneChatIsEnabled } from '~/stores/scene/sceneChatIsEnabled';
	import { stageChat } from '~/stores/scene/stageChatPanelsOpen';
	let isFullscreen = isInFullscreen();
	let effects = createEffectsStore();

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

<div class="buttons">
	<div class="left">
		<!-- STATUS -->
		<MediaInputStatus />
	</div>
	<div class="center">
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
		{/if}
	</div>
	<div class="right">
		<!-- VIDEO -->
		<CameraActionButton minimal={isMobile} />

		<!-- AUDIO -->
		<MicrophoneActionButton minimal={isMobile} />
		<!-- FULLSCREEN -->
		<button
			type="button"
			class={btnClassList}
			transition:blur
			use:fullScreenAction
		>
			{#if $isFullscreen}
				<span class={iconClassList}
					><ion-icon name={'close-outline'}></ion-icon></span
				>
			{:else}
				<span class={iconClassList}
					><ion-icon name={'expand-outline'}></ion-icon></span
				>
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
				<span class={iconClassList}
					><ion-icon name="chatbubble-ellipses"></ion-icon></span
				>
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
			<span class={iconClassList}><ion-icon name="options"></ion-icon></span>
			{#if !isMobile}
				<span>Alternativ</span>
			{/if}
		</button>
	</div>
</div>

<style lang="scss">
	.button {
		height: 48px;
		background-color: black;
		border: 1px solid var(--bulma-border);
	}
	.button.effect {
		width: 50px;
	}
	.button:hover {
		border: 1px solid var(--bulma-border);
	}
	.buttons {
		margin-left: 1%;
		margin-right: 1%;
	}
	.left {
		text-align: left;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 1;
	}
	.center {
		text-align: center;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 1;
	}
	.right {
		text-align: right;
		flex-grow: 1;
		flex-grow: 1;
		flex-basis: 1;
	}

	.buttons {
		margin-left: 0px;
		margin-right: 0px;
	}
	@include mobile {
		.right,
		.center,
		.left {
			width: 100vw;
			text-align: center;
			:global {
				.button {
					margin-left: 16px;
					margin-right: 16px;
				}
			}
		}
		.left,
		.center .right {
			flex-grow: 0;
		}
	}
</style>
