<script lang="ts">
	import { blur } from "svelte/transition";
	import IconVideoOff from "~/components/icons/Icon-camera-off.svelte";
	import IconVideo from "~/components/icons/Icon-camera.svelte";
	import { enableCamera, disableCamera, peerStreamsStore } from "~/api/stageNew";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { currentPeerStore } from "~/api/auth";
	import { showSceneSettingsStore } from "~/api/backstage";

	export let minimal: boolean = false;

	// Track camera state locally
	let isCameraOn = false;
	let isProcessing = false;
	let errorMessage = "";

	// Get local stream to check if we have video
	$: myPeerId = $wsPeerIdStore;
	$: localStream = $peerStreamsStore[myPeerId];
	$: hasVideoTrack = localStream?.getVideoTracks().length > 0;

	// Update camera state based on stream
	$: if (hasVideoTrack !== undefined) {
		isCameraOn = hasVideoTrack;
	}

	$: hasError = !!errorMessage;

	async function handleClick() {
		if (isProcessing) return;

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
			isCameraOn = hasVideoTrack;
		} finally {
			isProcessing = false;
		}
	}
</script>

{#if $currentPeerStore.actor || $currentPeerStore.manager || $showSceneSettingsStore.visitorVideoEnabled}
	<button type="button" class="button is-small" class:is-loading={isProcessing} disabled={isProcessing} transition:blur on:click={handleClick}>
		<span class="icon is-size-4" class:has-text-danger={hasError} class:has-text-success={isCameraOn}>
			{#if isCameraOn}
				<IconVideo />
			{:else}
				<IconVideoOff />
			{/if}
		</span>
		{#if !minimal}
			<span>
				Camera:
				{#if errorMessage}
					{errorMessage}
				{:else if isProcessing}
					...
				{:else if isCameraOn}
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
