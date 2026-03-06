<script lang="ts">
	import { onMount } from "svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import IconVideo from "~/components/icons/Icon-video.svelte";
	import IconAlertTriangle from "~/components/icons/Icon-alert-triangle.svelte";
	import IconCheck from "~/components/icons/Icon-check.svelte";
	import IconInfo from "~/components/icons/Icon-info.svelte";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconCameraOff from "~/components/icons/Icon-camera-off.svelte";

	export let onAudioDeviceSelected: (deviceId: string) => Promise<void>;
	export let onVideoDeviceSelected: (deviceId: string) => Promise<void>;
	export let currentAudioDeviceId: string = "";
	export let currentVideoDeviceId: string = "";

	let audioDevices: MediaDeviceInfo[] = [];
	let videoDevices: MediaDeviceInfo[] = [];
	let hasAudioPermission = false;
	let hasVideoPermission = false;
	let isLoading = false;
	let errorMessage = "";

	async function checkPermissions() {
		isLoading = true;
		errorMessage = "";

		try {
			await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});

			const devices = await navigator.mediaDevices.enumerateDevices();
			audioDevices = devices.filter((device) => device.kind === "audioinput");
			videoDevices = devices.filter((device) => device.kind === "videoinput");
			hasAudioPermission = audioDevices.length > 0 && !(audioDevices.length == 1 && !audioDevices[0].label);
			hasVideoPermission = videoDevices.length > 0 && !(videoDevices.length == 1 && !videoDevices[0].label);
		} catch (error) {
			console.error("Error checking permissions:", error);
			errorMessage = "Kunde inte komma åt enheter";
		} finally {
			isLoading = false;
		}
	}

	async function selectAudioDevice(deviceId: string) {
		if (!hasAudioPermission) {
			console.log("[CleanDeviceSelector] No audio permission, cannot select device");
			return;
		}

		console.log(`[CleanDeviceSelector] Audio device selected: ${deviceId}`);
		currentAudioDeviceId = deviceId;
		if (onAudioDeviceSelected) {
			try {
				console.log("[CleanDeviceSelector] Calling onAudioDeviceSelected callback");
				await onAudioDeviceSelected(deviceId);
				console.log("[CleanDeviceSelector] onAudioDeviceSelected completed successfully");
			} catch (error) {
				console.error("[CleanDeviceSelector] Error in onAudioDeviceSelected:", error);
				errorMessage = "Misslyckades med att byta ljudenhet";
			}
		} else {
			console.warn("[CleanDeviceSelector] onAudioDeviceSelected callback not provided");
		}
	}

	async function selectVideoDevice(deviceId: string) {
		if (!hasVideoPermission) {
			console.log("[CleanDeviceSelector] No video permission, cannot select device");
			return;
		}

		console.log(`[CleanDeviceSelector] Video device selected: ${deviceId}`);
		currentVideoDeviceId = deviceId;
		if (onVideoDeviceSelected) {
			try {
				console.log("[CleanDeviceSelector] Calling onVideoDeviceSelected callback");
				await onVideoDeviceSelected(deviceId);
				console.log("[CleanDeviceSelector] onVideoDeviceSelected completed successfully");
			} catch (error) {
				console.error("[CleanDeviceSelector] Error in onVideoDeviceSelected:", error);
				errorMessage = "Misslyckades med att byta kameranhet";
			}
		} else {
			console.warn("[CleanDeviceSelector] onVideoDeviceSelected callback not provided");
		}
	}

	// Check permissions on mount
	onMount(() => {
		checkPermissions();
	});
</script>

<div class="device-selector">
	<!-- Audio Devices -->
	<div class="device-section">
		<div class="section-header">
			<span class="icon"><IconMic /></span>
			<h3>Mikrofon</h3>
		</div>

		{#if isLoading}
			<div class="loading-state">
				<span class="icon"><IconAlertTriangle /></span>
				<span>Laddar enheter...</span>
			</div>
		{:else if !hasAudioPermission}
			<div class="no-permission-state">
				<span class="icon"><IconMicOff /></span>
				<p>Mikrofonåtkomst krävs</p>
				<p class="hint">Ge behörighet i webbläsarinställningarna</p>
			</div>
		{:else}
			<div class="device-list">
				{#each audioDevices as device (device.deviceId)}
					<button class="device-item" class:selected={currentAudioDeviceId === device.deviceId} on:click={() => selectAudioDevice(device.deviceId)}>
						<span class="device-name">{device.label || `Mikrofon ${audioDevices.indexOf(device) + 1}`}</span>
						{#if currentAudioDeviceId === device.deviceId}
							<span class="icon check-icon"><IconCheck /></span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Video Devices -->
	<div class="device-section">
		<div class="section-header">
			<span class="icon"><IconVideo /></span>
			<h3>Kamera</h3>
		</div>

		{#if isLoading}
			<div class="loading-state">
				<span class="icon"><IconAlertTriangle /></span>
				<span>Laddar enheter...</span>
			</div>
		{:else if !hasVideoPermission}
			<div class="no-permission-state">
				<span class="icon"><IconCameraOff /></span>
				<p>Kameraåtkomst krävs</p>
				<p class="hint">Ge behörighet i webbläsarinställningarna</p>
			</div>
		{:else}
			<div class="device-list">
				{#each videoDevices as device (device.deviceId)}
					<button class="device-item" class:selected={currentVideoDeviceId === device.deviceId} on:click={() => selectVideoDevice(device.deviceId)}>
						<span class="device-name">{device.label || `Kamera ${videoDevices.indexOf(device) + 1}`}</span>
						{#if currentVideoDeviceId === device.deviceId}
							<span class="icon check-icon"><IconCheck /></span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if errorMessage}
		<div class="global-error">
			<span class="icon"><IconAlertTriangle /></span>
			<span>{errorMessage}</span>
		</div>
	{/if}
</div>

<style>
	.device-selector {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.safari-warning {
		background-color: #fff3cd;
		padding: 12px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
		color: #856404;
		margin-bottom: 12px;
	}

	.device-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: var(--channelle-text-color);
	}

	.loading-state,
	.no-permission-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px;
		text-align: center;
		color: var(--channelle-text-color);
	}

	.no-permission-state {
		background-color: transparent;
		border: none;
	}

	.no-permission-state p {
		margin: 0;
		font-size: 0.9rem;
	}

	.hint {
		font-size: 0.8rem;
		color: #666;
		font-style: italic;
		margin: 4px 0 0 0;
	}

	.device-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 200px;
		overflow-y: auto;
		padding: 4px;
		background-color: var(--channelle-surface-color);
		border-radius: 8px;
	}

	.device-item {
		background: transparent;
		border: 1px solid var(--channelle-border-color);
		border-radius: 6px;
		padding: 8px 12px;
		text-align: left;
		color: var(--channelle-text-color);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.device-item:hover {
		background-color: var(--channelle-hover-color);
		border-color: var(--channelle-primary-color);
	}

	.device-item.selected {
		background-color: var(--channelle-primary-color);
		border-color: var(--channelle-primary-color);
		color: white;
	}

	.device-item.selected:hover {
		background-color: var(--channelle-primary-dark);
	}

	.device-name {
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 80%;
	}

	.check-icon {
		color: white;
		font-size: 1rem;
	}

	.global-error {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: var(--channelle-danger-light);
		border-radius: 6px;
		color: var(--channelle-danger-color);
		font-size: 0.9rem;
	}

	.icon {
		font-size: 1rem;
	}

	.icon:first-child {
		margin-right: 8px;
	}
</style>
