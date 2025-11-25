<script lang="ts">
	import { blur } from "svelte/transition";
	import IconVideoOff from "~/components/picol/icons/Picol-video-remove.svelte";
	import IconVideo from "~/components/picol/icons/Picol-video-run.svelte";
	import { currentPeerStore, videoProducer, camPausedStore, localMediaStream, enableVideo, toggleVideoPaused } from "~/api";
	import { showSceneSettingsStore } from "~/api";

	$: isOn = !!$videoProducer && !$camPausedStore;
	$: hasLocalStream = !!$localMediaStream;
	let errorMessage = "";
	$: hasError = !!errorMessage;

	export let minimal: boolean = false;

	async function handleClick() {
		try {
			errorMessage = "";
			if (!hasLocalStream || !$localMediaStream?.getVideoTracks().length) {
				await enableVideo();
			} else if (!isOn) {
				await toggleVideoPaused(false);
			} else {
				await toggleVideoPaused(true);
			}
		} catch (error: any) {
			errorMessage = error.message || "Fel";
		}
	}
</script>

{#if $currentPeerStore.actor || $currentPeerStore.manager || $showSceneSettingsStore.visitorVideoEnabled}
	<button type="button" class="button is-small" transition:blur on:click={handleClick}>
		<span class="icon is-size-4" class:has-text-danger={hasError} class:has-text-success={isOn}
			>{#if isOn}<IconVideo />{:else}<IconVideoOff />{/if}</span
		>
		{#if !minimal}
			<span
				>Kamera:
				{#if errorMessage}
					{errorMessage}
				{:else if isOn}
					på
				{:else}
					av
				{/if}
			</span>
		{/if}
	</button>
{/if}

<style lang="scss">
	.button {
		border-radius: 0;
		border: none;
		padding: 12px;
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
	}
</style>
