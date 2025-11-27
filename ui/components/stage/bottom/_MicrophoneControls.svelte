<script lang="ts">
	import { blur } from "svelte/transition";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import { enableMicrophone, disableMicrophone, peerStreamsStore } from "~/api/stageNew";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { currentPeerStore } from "~/api/auth";
	import { showSceneSettingsStore } from "~/api/backstage";

	export let minimal: boolean = false;

	// Track microphone state locally
	let isMicOn = false;
	let isProcessing = false;
	let errorMessage = "";

	// Get local stream to check if we have audio
	$: myPeerId = $wsPeerIdStore;
	$: localStream = $peerStreamsStore[myPeerId];
	$: hasAudioTrack = localStream?.getAudioTracks().length > 0;

	// Update mic state based on stream
	$: if (hasAudioTrack !== undefined) {
		isMicOn = hasAudioTrack;
	}

	$: hasError = !!errorMessage;

	async function handleClick() {
		if (isProcessing) return;

		try {
			isProcessing = true;
			errorMessage = "";

			if (isMicOn) {
				// Turn off microphone
				await disableMicrophone();
				isMicOn = false;
			} else {
				// Turn on microphone
				await enableMicrophone();
				isMicOn = true;
			}
		} catch (error: any) {
			console.error("[MicrophoneControlsNew] Error toggling microphone:", error);
			errorMessage = error.message || "Microphone error";
			// Reset state on error
			isMicOn = hasAudioTrack;
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if $currentPeerStore.actor || $currentPeerStore.manager || $showSceneSettingsStore.visitorAudioEnabled}
	<button
		type="button"
		class="button is-small"
		class:is-loading={isProcessing}
		disabled={isProcessing}
		transition:blur
		on:click={handleClick}
	>
		<span class="icon is-size-4" class:has-text-danger={hasError} class:has-text-success={isMicOn}>
			{#if isMicOn}
				<IconMic />
			{:else}
				<IconMicOff />
			{/if}
		</span>
		{#if !minimal}
			<span>
				Microphone:
				{#if errorMessage}
					{errorMessage}
				{:else if isProcessing}
					...
				{:else if isMicOn}
					On
				{:else}
					Off
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
		position: relative;

		&:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}

		&.is-loading {
			color: transparent;
			pointer-events: none;

			&::after {
				animation: spinAround 500ms infinite linear;
				border: 2px solid var(--channelle-menu-text-color);
				border-radius: 9999px;
				border-right-color: transparent;
				border-top-color: transparent;
				content: "";
				display: block;
				height: 1em;
				position: absolute;
				width: 1em;
				inset-block-start: calc(50% - (1em * 0.5));
				inset-inline-start: calc(50% - (1em * 0.5));
			}
		}
	}

	@keyframes spinAround {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(359deg);
		}
	}
</style>
