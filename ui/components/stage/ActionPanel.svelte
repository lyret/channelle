<script lang="ts">
	import { windowSizeStore } from '$ui/device';
	import { fullScreenAction } from '~/legos/actions/fullScreenAction';
	import { isInFullscreen } from '~/legos/stores/fullscreenStore';
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { update } from '~/lib';
	import { currentParticipant } from '~/lib/stores/api';
	import { createEffectsStore } from '~/stores/particles/effectsStore';
	import { userCameraBans, userMicrophoneBans } from '~/stores/users';
	import { sceneVisitorAudioIsEnabled } from '~/stores/scene/sceneVisitorAudioIsEnabled';
	import { sceneEffectsIsEnabled } from '~/stores/scene/sceneEffectsIsEnabled';
	import { stageSettings } from '~/stores/scene/stageSettingsIsEnbaled';
	import CameraActionButton from './actionButtons/CameraActionButton.svelte';
	import MicrophoneActionButton from './actionButtons/MicrophoneActionButton.svelte';

	let windowSize = windowSizeStore();
	$: isMobile = $windowSize.width <= 768;
	let isFullscreen = isInFullscreen();
	let effects = createEffectsStore();

	async function updateName() {
		const currentName = $currentParticipant.name;
		const newName =
			window.prompt('Byt namn till...', currentName) || currentName;
		await update('participant', {
			where: { id: $currentParticipant.id },
			data: { name: newName },
		});
	}

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
		<!-- CURRENT USER -->
		<button class={btnClassList} transition:blur on:click={updateName}>
			{#if !isMobile}
				<span class={iconClassList}
					><ion-icon name="person-circle-outline"></ion-icon></span
				>
			{/if}
			<span>{$currentParticipant?.name} </span>
		</button>
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
		<!-- STAGE SETTINGS -->
		{#if $currentParticipant.manager || $currentParticipant.actor}
			<button
				class={btnClassList}
				transition:blur
				class:has-text-info={$stageSettings}
				on:click={() => stageSettings.set(!$stageSettings)}
			>
				<span class={iconClassList}><ion-icon name="options"></ion-icon></span>
				{#if !isMobile}
					<span>Inställningar </span>
				{/if}
			</button>
		{/if}
	</div>
</div>

<style>
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

	@media (max-width: 768px) {
		.buttons {
			margin-left: 0px;
			margin-right: 0px;
		}
		.right,
		.left {
			text-align: left;
		}
		.left,
		.right,
		.center {
			flex-grow: 0;
		}
	}
</style>
