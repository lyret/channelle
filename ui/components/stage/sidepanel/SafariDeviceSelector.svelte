<script lang="ts">
	import { onMount } from "svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import IconVideo from "~/components/icons/Icon-video.svelte";
	import IconAlertTriangle from "~/components/icons/Icon-alert-triangle.svelte";
	import IconCheck from "~/components/icons/Icon-check.svelte";
	import IconCameraOff from "~/components/icons/Icon-camera-off.svelte";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconInfo from "~/components/icons/Icon-info.svelte";

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
	let isSafari = false;
	let safariWarningShown = false;

	// Detect Safari browser
	function detectSafari() {
		const userAgent = window.navigator.userAgent;
		isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

		// Also check for iOS devices which have additional restrictions
		const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

		if (isSafari || isIOS) {
			console.warn("Safari/iOS detected - applying Safari-specific workarounds");
		}
	}

	async function checkPermissions() {
		if (isSafari && !safariWarningShown) {
			safariWarningShown = true;
			console.warn("Safari detected - device enumeration may require user interaction");
		}

		try {
			// Safari requires getUserMedia to be called first before enumerateDevices works properly
			if (isSafari) {
				await requestSafariPermissions();
				return; // enumerateDevices will be called after getUserMedia
			}

			const devices = await navigator.mediaDevices.enumerateDevices();
			audioDevices = devices.filter((device) => device.kind === "audioinput");
			videoDevices = devices.filter((device) => device.kind === "videoinput");
			hasAudioPermission = audioDevices.length > 0;
			hasVideoPermission = videoDevices.length > 0;
		} catch (error) {
			console.error("Error checking permissions:", error);
			errorMessage = "Could not access devices";
		}
	}

	async function requestSafariPermissions() {
		isLoading = true;
		errorMessage = "";

		try {
			// Safari workaround: we need to call getUserMedia first to get proper device enumeration
			// We'll request both audio and video, then immediately stop the tracks
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true
			});

			// Stop all tracks immediately since we only wanted permissions
			stream.getTracks().forEach(track => track.stop());

			// Now we can enumerate devices properly
			const devices = await navigator.mediaDevices.enumerateDevices();
			audioDevices = devices.filter((device) => device.kind === "audioinput");
			videoDevices = devices.filter((device) => device.kind === "videoinput");
			hasAudioPermission = audioDevices.length > 0;
			hasVideoPermission = videoDevices.length > 0;

		} catch (error: any) {
			console.error("Safari permission error:", error);

			// Handle specific Safari errors
			if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
				errorMessage = "Permission denied. Please enable camera/microphone access in Safari settings.";
			} else if (error.name === 'NotFoundError') {
				errorMessage = "No camera/microphone found. Please connect a device.";
			} else if (error.name === 'NotReadableError') {
				errorMessage = "Camera/microphone is already in use by another application.";
			} else {
				errorMessage = error.message || "Failed to access camera/microphone";
			}
		} finally {
			isLoading = false;
		}
	}

	async function selectAudioDevice(deviceId: string) {
		if (!hasAudioPermission) {
			if (isSafari) {
				await requestSafariPermissions();
			} else {
				await requestPermissions();
			}
			return;
		}

		currentAudioDeviceId = deviceId;
		if (onAudioDeviceSelected) {
			try {
				await onAudioDeviceSelected(deviceId);
			} catch (error) {
				console.error("Error selecting audio device:", error);
				errorMessage = "Failed to switch audio device";
			}
		}
	}

	async function selectVideoDevice(deviceId: string) {
		if (!hasVideoPermission) {
			if (isSafari) {
				await requestSafariPermissions();
			} else {
				await requestPermissions();
			}
			return;
		}

		currentVideoDeviceId = deviceId;
		if (onVideoDeviceSelected) {
			try {
				await onVideoDeviceSelected(deviceId);
			} catch (error) {
				console.error("Error selecting video device:", error);
				errorMessage = "Failed to switch video device";
			}
		}
	}

	async function requestPermissions() {
		isLoading = true;
		errorMessage = "";
		try {
			// Request both audio and video permissions
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true
			});

			// Stop all tracks immediately since we only wanted permissions
			stream.getTracks().forEach(track => track.stop());

			// Now enumerate devices with permissions granted
			await checkPermissions();
		} catch (error: any) {
			console.error("Error requesting permissions:", error);
			errorMessage = error.message || "Permission denied";
		} finally {
			isLoading = false;
		}
	}

	// Check permissions on mount
	onMount(() => {
		detectSafari();
		checkPermissions();
	});

	export function checkPermissionsManually() {
		checkPermissions();
	}
</script>

<div class="device-selector">
	{#if isSafari && !safariWarningShown}
		<div class="safari-warning">
			<span class="icon"><IconInfo /></span>
			<span>Safari requires you to interact with the page before accessing camera/microphone. Click the permission buttons below.</span>
		</div>
	{/if}

	<!-- Audio Devices -->
	<div class="device-section">
		<div class="section-header">
			<span class="icon"><IconMic /></span>
			<h3>Microphone</h3>
		</div>

		{#if !hasAudioPermission}
			<div class="permission-request">
				<p>Microphone access required</p>
				<button
					class="button is-primary is-small"
					disabled={isLoading}
					on:click={isSafari ? requestSafariPermissions : requestPermissions}
				>
					{#if isLoading}
						<span class="icon"><IconAlertTriangle /></span>
						<span>Requesting...</span>
					{:else}
						<span class="icon"><IconMic /></span>
						<span>Allow Microphone</span>
					{/if}
				</button>
				{#if errorMessage}
					<p class="error-message">{errorMessage}</p>
				{/if}
				{#if isSafari}
					<p class="safari-hint">Click this button to grant permission</p>
				{/if}
			</div>
		{:else}
			<div class="device-list">
				{#each audioDevices as device (device.deviceId)}
					<button
						class="device-item"
						class:selected={currentAudioDeviceId === device.deviceId}
						on:click={() => selectAudioDevice(device.deviceId)}
					>
						<span class="device-name">{device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}</span>
						{#if currentAudioDeviceId === device.deviceId}
							<span class="icon check-icon"><IconCheck /></span>
						{/if}
					</button>
				{/each}

				<button
					class="device-item"
					class:selected={currentAudioDeviceId === ""}
					on:click={() => selectAudioDevice("")}
				>
					<span class="device-name">Default Microphone</span>
					{#if currentAudioDeviceId === ""}
						<span class="icon check-icon"><IconCheck /></span>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	<!-- Video Devices -->
	<div class="device-section">
		<div class="section-header">
			<span class="icon"><IconVideo /></span>
			<h3>Camera</h3>
		</div>

		{#if !hasVideoPermission}
			<div class="permission-request">
				<p>Camera access required</p>
				<button
					class="button is-primary is-small"
					disabled={isLoading}
					on:click={isSafari ? requestSafariPermissions : requestPermissions}
				>
					{#if isLoading}
						<span class="icon"><IconAlertTriangle /></span>
						<span>Requesting...</span>
					{:else}
						<span class="icon"><IconVideo /></span>
						<span>Allow Camera</span>
					{/if}
				</button>
				{#if errorMessage}
					<p class="error-message">{errorMessage}</p>
				{/if}
				{#if isSafari}
					<p class="safari-hint">Click this button to grant permission</p>
				{/if}
			</div>
		{:else}
			<div class="device-list">
				{#each videoDevices as device (device.deviceId)}
					<button
						class="device-item"
						class:selected={currentVideoDeviceId === device.deviceId}
						on:click={() => selectVideoDevice(device.deviceId)}
					>
						<span class="device-name">{device.label || `Camera ${videoDevices.indexOf(device) + 1}`}</span>
						{#if currentVideoDeviceId === device.deviceId}
							<span class="icon check-icon"><IconCheck /></span>
						{/if}
					</button>
				{/each}

				<button
					class="device-item"
					class:selected={currentVideoDeviceId === ""}
					on:click={() => selectVideoDevice("")}
				>
					<span class="device-name">Default Camera</span>
					{#if currentVideoDeviceId === ""}
						<span class="icon check-icon"><IconCheck /></span>
					{/if}
				</button>
			</div>
		{/if}
	</div>

	{#if errorMessage && (hasAudioPermission || hasVideoPermission)}
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

	.permission-request {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background-color: var(--channelle-surface-color);
		border-radius: 8px;
		text-align: center;
	}

	.permission-request p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--channelle-text-color);
	}

	.safari-hint {
		font-size: 0.8rem;
		color: #666;
		font-style: italic;
		margin-top: 4px;
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

	.error-message {
		color: var(--channelle-danger-color);
		font-size: 0.8rem;
		margin: 4px 0 0 0;
		text-align: center;
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
</style>
