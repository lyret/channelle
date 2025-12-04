<script lang="ts">
	import { blur } from "svelte/transition";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import { enableMicrophone, disableMicrophone } from "~/api/stageNew";
	import { localPeerMediaState } from "~/api/stageNew/peerMedia";

	export let minimal: boolean = false;

	// Track microphone state locally
	let isMicOn = false;
	let isProcessing = false;
	let errorMessage = "";

	// Use the local peer media state directly
	$: mediaState = $localPeerMediaState;

	// Update mic state based on media state
	$: if (mediaState?.hasLocalAudioTrack !== undefined) {
		isMicOn = mediaState.hasLocalAudioTrack;
	}

	// Automatically disable microphone when muted
	$: if (mediaState?.audioMuted && isMicOn) {
		disableMicrophone().catch((error) => {
			console.error("[MicrophoneControls] Error disabling microphone on mute:", error);
		});
	}

	async function handleClick() {
		if (isProcessing || mediaState?.audioMuted) return; // Don't allow if muted

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
			isMicOn = mediaState?.hasLocalAudioTrack || false;
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if mediaState?.isActor || mediaState?.isManager || mediaState?.visitorAudioEnabled}
	<button
		type="button"
		class="button is-small"
		class:is-loading={isProcessing}
		class:is-success={isMicOn && !mediaState.audioMuted}
		class:is-info={!isMicOn && mediaState.audioAllowed && !mediaState.audioMuted}
		class:is-light={mediaState.audioMuted || (!isMicOn && !mediaState.audioAllowed)}
		disabled={isProcessing || mediaState.audioMuted}
		transition:blur
		on:click={handleClick}
	>
		<span class="icon is-size-4" class:has-text-danger={!!errorMessage} class:has-text-grey={mediaState.audioMuted}>
			{#if mediaState.audioMuted || !isMicOn}
				<IconMicOff />
			{:else}
				<IconMic />
			{/if}
		</span>
		{#if !minimal}
			<span>
				{#if errorMessage}
					{errorMessage}
				{:else if isProcessing}
					Ansluter...
				{:else if isMicOn && !mediaState.audioMuted}
					Aktiv
				{:else if mediaState.audioMuted}
					Blockerad (DB)
				{:else if mediaState.audioAllowed}
					Tillåten
				{:else}
					Av
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
		transition:
			opacity 0.2s ease,
			background-color 0.2s ease;

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			background-color: #363636 !important;

			.icon {
				color: #999 !important;
			}

			span:not(.icon) {
				color: #999 !important;
			}
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
