<script lang="ts">
	import { blur } from "svelte/transition";
	import IconVideoOff from "~/components/icons/Icon-camera-off.svelte";
	import IconVideo from "~/components/icons/Icon-camera.svelte";
	import { enableCamera, disableCamera } from "~/api/stageNew";
	import { localPeerMediaState } from "~/api/stageNew/peerMedia";

	export let minimal: boolean = false;

	// Track camera state locally
	let isCameraOn = false;
	let isProcessing = false;
	let errorMessage = "";

	// Use the local peer media state directly
	$: mediaState = $localPeerMediaState;

	// Update camera state based on media state
	$: if (mediaState?.hasLocalVideoTrack !== undefined) {
		isCameraOn = mediaState.hasLocalVideoTrack;
	}

	// Automatically disable camera when muted
	$: if (mediaState?.videoMuted && isCameraOn) {
		disableCamera().catch((error) => {
			console.error("[CameraControls] Error disabling camera on mute:", error);
		});
	}

	async function handleClick() {
		if (isProcessing || mediaState?.videoMuted) return; // Don't allow if muted

		try {
			isProcessing = true;
			errorMessage = "";

			if (isCameraOn) {
				// Turn off camera
				await disableCamera();
				isCameraOn = false;
			} else {
				// Turn on camera
				await enableCamera();
				isCameraOn = true;
			}
		} catch (error: any) {
			console.error("[CameraControlsNew] Error toggling camera:", error);
			errorMessage = error.message || "Camera error";
			// Reset state on error
			isCameraOn = mediaState?.hasLocalVideoTrack || false;
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if mediaState?.isActor || mediaState?.isManager || mediaState?.visitorVideoEnabled}
	<button
		type="button"
		class="button is-small"
		class:is-loading={isProcessing}
		class:is-success={isCameraOn && !mediaState.videoMuted}
		class:is-info={!isCameraOn && mediaState.videoAllowed && !mediaState.videoMuted}
		class:is-light={mediaState.videoMuted || (!isCameraOn && !mediaState.videoAllowed)}
		disabled={isProcessing || mediaState.videoMuted}
		transition:blur
		on:click={handleClick}
	>
		<span class="icon is-size-4" class:has-text-danger={!!errorMessage} class:has-text-grey={mediaState.videoMuted}>
			{#if mediaState.videoMuted || !isCameraOn}
				<IconVideoOff />
			{:else}
				<IconVideo />
			{/if}
		</span>
		{#if !minimal}
			<span>
				{#if errorMessage}
					{errorMessage}
				{:else if isProcessing}
					Ansluter...
				{:else if isCameraOn && !mediaState.videoMuted}
					Aktiv
				{:else if mediaState.videoMuted}
					Blockerad (DB)
				{:else if mediaState.videoAllowed}
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
