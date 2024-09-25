<script lang="ts">
	import { fullScreenAction } from '$lib/actions/fullScreenAction';
	import { isInFullscreen } from '$lib/stores/fullscreenStore';
	import { onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { update } from '~/api';
	import { createMediaStore } from '~/stores';
	import { currentParticipant } from '~/stores/connection';
	import { createMediaOptionStore } from '~/stores/media';
	import { createEffectsStore } from '~/stores/particles/effectsStore';
	import { userCameraBans, userMicrophoneBans } from '~/stores/users';

	let isFullscreen = isInFullscreen();
	let allowVisitorAudio = createMediaOptionStore('allowVisitorAudio');
	let effectsAreEnabled = createMediaOptionStore('effectsAreEnabled');
	let isProducingVideo = createMediaStore('isProducingVideo');
	let isProducingAudio = createMediaStore('isProducingAudio');
	let effects = createEffectsStore();

	async function updateName() {
		if ($currentParticipant) {
			const currentName = $currentParticipant.name;
			const newName =
				window.prompt('Byt namn till...', currentName) || currentName;
			await update('participant', {
				where: { id: $currentParticipant.id },
				data: { name: newName },
			});
		}
	}

	// Make sure effects are rendered
	onMount(() => {
		const stop = effects.subscribe(() => {});

		return () => {
			stop();
		};
	});

	// Class list of all buttons in the action bar
	const btnClassList = 'button is-dark is-small';
	const iconClassList = 'icon is-size-4';
</script>

<div class="buttons">
	<div class="left">
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

		<!-- CURRENT USER -->
		<button class={btnClassList} transition:blur on:click={updateName}>
			<span class={iconClassList}
				><ion-icon name="person-circle-outline"></ion-icon></span
			>
			<span>{$currentParticipant?.name} </span></button
		>
	</div>
	<div class="center">
		<!-- VIDEO -->
		{#if $currentParticipant.actor || $currentParticipant.manager}
			<button
				type="button"
				disabled={$userCameraBans[$currentParticipant.id]}
				class={btnClassList}
				transition:blur
				class:has-text-danger={$isProducingVideo}
				on:click={() =>
					$isProducingVideo
						? isProducingVideo.stopPublishVideo()
						: isProducingVideo.publishVideo()}
			>
				<span class={iconClassList}
					><ion-icon name={$isProducingVideo ? 'videocam-off' : 'videocam'}
					></ion-icon></span
				>
				<span>{$isProducingVideo ? 'Stäng av kameran' : 'Starta kameran'}</span>
			</button>
		{/if}

		<!-- AUDIO -->
		{#if $currentParticipant.actor || $allowVisitorAudio}
			<button
				type="button"
				class={btnClassList}
				transition:blur
				disabled={$userMicrophoneBans[$currentParticipant.id]}
				class:has-text-danger={$isProducingAudio}
				on:click={() =>
					$isProducingAudio
						? isProducingAudio.stopPublishAudio()
						: isProducingAudio.publishAudio()}
			>
				<span class={iconClassList}
					><ion-icon name={$isProducingAudio ? 'mic-off' : 'mic'}></ion-icon><br
					/></span
				>
				<span class=""
					>{$isProducingAudio
						? 'Stäng av mikrofonen'
						: 'Starta mikrofonen'}</span
				>
			</button>
		{/if}

		<!-- EFFECTS -->
		{#if $effectsAreEnabled}
			<button
				class={btnClassList + ' is-success is-light'}
				transition:blur
				on:click={() => effects.set({ type: 'applause', number: 1 })}
			>
				<span>👏</span></button
			>
			<button
				class={btnClassList + ' is-primary is-light'}
				transition:blur
				on:click={() => effects.set({ type: 'flowers', number: 1 })}
			>
				<span>🌹</span></button
			>
		{/if}
	</div>
	<div class="right">
		<!-- BACKSTAGE LINK -->
		{#if $currentParticipant.actor || $currentParticipant.manager}
			<a
				class={btnClassList + ' has-text-info'}
				transition:blur
				href="/backstage"
				target="_blank"
			>
				<span class={iconClassList}
					><ion-icon name="speedometer"></ion-icon></span
				>
				<span>Gå Backstage </span>
				<span class={iconClassList}
					><ion-icon name="arrow-forward-circle-outline"></ion-icon></span
				>
			</a>
		{/if}
	</div>
</div>

<style>
	.buttons {
		margin-left: 5%;
		margin-right: 5%;
	}
	.left {
		text-align: left;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 0;
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
		flex-basis: 0;
	}
</style>
