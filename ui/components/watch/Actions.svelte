<script lang="ts">
	import { fullScreenAction } from '$lib/actions/fullScreenAction';
	import { isInFullscreen } from '$lib/stores/fullscreenStore';
	import { blur } from 'svelte/transition';
	import { update } from '~/api';
	import { createMediaStore } from '~/stores';
	import { currentParticipant } from '~/stores/connection';
	import ChatInput from '~/components/chat/ChatInput.svelte';
	import { createMediaLayoutStore } from '~/stores/media';

	let layout = createMediaLayoutStore();
	const isProducingVideo = createMediaStore('isProducingVideo');
	const isProducingAudio = createMediaStore('isProducingAudio');

	let isFullscreen = isInFullscreen();

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
	const btnClassList = 'button is-dark is-rounded';
</script>

<div class="buttons is-centered is-fullwidth">
	<!-- FULLSCREEN -->
	<button
		type="button"
		class={btnClassList}
		transition:blur
		use:fullScreenAction
	>
		{#if $isFullscreen}
			<span class="icon"><ion-icon name={'close-outline'}></ion-icon></span>
		{:else}
			<span class="icon"><ion-icon name={'expand-outline'}></ion-icon></span>
		{/if}
	</button>
	<button class={btnClassList} transition:blur on:click={updateName}>
		<span class="icon"><ion-icon name="person-circle-outline"></ion-icon></span>
		<span>{$currentParticipant?.name} </span></button
	>
	{#if $currentParticipant.actor || $currentParticipant.manager}
		<button
			type="button"
			disabled={!$currentParticipant.allowedVideo}
			class={btnClassList}
			transition:blur
			class:has-text-info={!$isProducingVideo}
			class:has-text-danger={$isProducingVideo}
			on:click={() =>
				$isProducingVideo
					? isProducingVideo.stopPublishVideo()
					: isProducingVideo.publishVideo()}
		>
			<span class="icon"
				><ion-icon name={$isProducingVideo ? 'videocam-off' : 'videocam'}
				></ion-icon></span
			>
			<span>{$isProducingVideo ? 'Stäng av kameran' : 'Starta kameran'}</span>
		</button>
	{/if}
	{#if $currentParticipant.actor || $layout.allowVisitorAudio}
		<button
			type="button"
			class={btnClassList}
			transition:blur
			disabled={!$currentParticipant.allowedAudio}
			class:has-text-danger={$isProducingAudio}
			on:click={() =>
				$isProducingAudio
					? isProducingAudio.stopPublishAudio()
					: isProducingAudio.publishAudio()}
		>
			<span class="icon"
				><ion-icon name={$isProducingAudio ? 'mic-off' : 'mic'}
				></ion-icon></span
			>
			<span
				>{$isProducingAudio ? 'Stäng av mikrofonen' : 'Starta mikrofonen'}</span
			>
		</button>
	{/if}
	{#if $layout.allowChat}
		<ChatInput />
	{/if}
	<!-- <button class="button icon">
		<ion-icon name="expand-outline"></ion-icon>
		<span>Fullscreen</span>
	</button> -->
	{#if $currentParticipant.actor || $currentParticipant.manager}
		<a class={btnClassList} transition:blur href="/backstage" target="_blank">
			<span>Gå Backstage </span>
			<span class="icon"
				><ion-icon name="arrow-forward-circle-outline"></ion-icon></span
			></a
		>
	{/if}
</div>

<!-- <div>
		<button id="btn_screen" on:click={() => {
			// TODO: Make display media passable so that its permitted
			console.log(navigator.mediaDevices.getDisplayMedia({
			  video: true,
			}));
			api.publish("screen")}} >Share Screen</button>
		<span id="screen_status"></span>
	</div> -->
