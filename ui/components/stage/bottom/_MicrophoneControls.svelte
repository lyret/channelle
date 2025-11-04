<script lang="ts">
	import { blur } from "svelte/transition";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import { peerStore, audioProducer, micPausedStore, localMediaStream, enableAudio, toggleAudioPaused, stageHaveVisitorAudioEnabledStore } from "~/api/media";

	$: isOn = !!$audioProducer && !$micPausedStore;
	$: hasLocalStream = !!$localMediaStream;
	let errorMessage = "";
	$: hasError = !!errorMessage;

	export let minimal: boolean = false;

	async function handleOnClick() {
		try {
			errorMessage = "";
			if (!hasLocalStream || !$localMediaStream?.getAudioTracks().length) {
				await enableAudio();
			} else if (!isOn) {
				await toggleAudioPaused(false);
			} else {
				await toggleAudioPaused(true);
			}
		} catch (error: any) {
			errorMessage = error.message || "Fel";
		}
	}
</script>

{#if $peerStore.actor || $peerStore.manager || $stageHaveVisitorAudioEnabledStore}
	<button type="button" class="button is-small" transition:blur on:click={handleOnClick}>
		<span class="icon is-size-4" class:has-text-danger={hasError} class:has-text-success={isOn}
			>{#if isOn}
				<IconMic />
			{:else}
				<IconMicOff />
			{/if}</span
		>
		{#if !minimal}
			<span
				>Mikrofon:
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
