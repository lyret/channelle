<script lang="ts">
	import { onMount } from "svelte";
	import IconMeh from "~/components/icons/Icon-meh.svelte";
	import IconBriefcase from "~/components/icons/Icon-briefcase.svelte";
	import IconAward from "~/components/icons/Icon-award.svelte";
	import { currentPeerStore } from "~/api";
	import { updatePeer } from "~/api/peers";
	import DeviceSelectorContents from "./_MediaDeviceSelectorContents.svelte";
	import Accordion from "~/components/Accordion.svelte";
	import { enableCamera, enableMicrophone, disableCamera, disableMicrophone, localPeerMediaState, peerStreamsStore } from "~/api/stage";
	import { selectedAudioDeviceId, selectedVideoDeviceId } from "~/stores/deviceSelection";

	let currentAudioDeviceId: string = "";
	let currentVideoDeviceId: string = "";
	$: mediaState = $localPeerMediaState;
	$: mediaStream = $localPeerMediaState ? $peerStreamsStore[$localPeerMediaState.peerId] : undefined;

	// Subscribe to the device selection stores
	$: selectedAudioDeviceId.subscribe((value) => {
		currentAudioDeviceId = value;
	});

	$: selectedVideoDeviceId.subscribe((value) => {
		currentVideoDeviceId = value;
	});

	async function updateName() {
		const currentName = $currentPeerStore.name;
		const newName = window.prompt("Byt namn till...", currentName) || currentName;
		if (newName && newName !== currentName) {
			await updatePeer($currentPeerStore.id, { name: newName });
		}
	}

	async function handleAudioDeviceSelected(deviceId: string) {
		currentAudioDeviceId = deviceId;
		selectedAudioDeviceId.set(deviceId);

		// If microphone is currently on, we need to restart it with the new device
		if (mediaState?.hasLocalAudioTrack) {
			await disableMicrophone();
			if (deviceId) {
				await enableMicrophone(deviceId);
			} else {
				await enableMicrophone(); // Use default
			}
		}
	}

	async function handleVideoDeviceSelected(deviceId: string) {
		currentVideoDeviceId = deviceId;
		selectedVideoDeviceId.set(deviceId);

		// If camera is currently on, we need to restart it with the new device
		if (mediaState?.hasLocalVideoTrack) {
			await disableCamera();
			if (deviceId) {
				await enableCamera(deviceId);
			} else {
				await enableCamera(); // Use default
			}
		}
	}

	// Check if we have active devices and update the current device IDs
	async function checkActiveDevices() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const audioDevices = devices.filter((device) => device.kind === "audioinput");
			const videoDevices = devices.filter((device) => device.kind === "videoinput");

			// If we have a local stream, try to find which devices are being used
			if (mediaStream) {
				const audioTracks = mediaStream.getAudioTracks();
				const videoTracks = mediaStream.getVideoTracks();

				if (audioTracks.length > 0) {
					const audioTrack = audioTracks[0];
					const audioDevice = audioDevices.find((d) => d.deviceId === audioTrack.getSettings().deviceId);
					if (audioDevice) {
						console.log("Updating current audio device to:", audioDevice.label || audioDevice.deviceId);
						currentAudioDeviceId = audioDevice.deviceId;
					}
				}

				if (videoTracks.length > 0) {
					const videoTrack = videoTracks[0];
					const videoDevice = videoDevices.find((d) => d.deviceId === videoTrack.getSettings().deviceId);
					if (videoDevice) {
						console.log("Updating current video device to:", videoDevice.label || videoDevice.deviceId);
						currentVideoDeviceId = videoDevice.deviceId;
					}
				}
			}
		} catch (error) {
			console.error("Error checking active devices:", error);
		}
	}

	onMount(() => {
		checkActiveDevices();
	});

	// React to media state changes to update selected devices
	$: if (mediaStream) {
		console.log("Media stream changed, updating active devices");
		checkActiveDevices();
	}
</script>

<p class="label">Ändra ditt namn</p>
<!-- CURRENT USER -->
<button class="button is-fullwidth mb-4 is-rounded" on:click={updateName}>
	<span class="icon"><IconMeh /></span>
	<span>{$currentPeerStore?.name} </span>
</button>
{#if $currentPeerStore?.manager}
	<div class="user-role">
		<span class="icon is-small">
			<IconBriefcase />
		</span>
		<span>tekniker</span>
	</div>
{:else if $currentPeerStore?.actor}
	<div class="user-role">
		<span class="icon is-small">
			<IconAward />
		</span>
		<span>skådespelare</span>
	</div>
{/if}
<Accordion title="Välj din kamera- och mikrofon- ingång" isOpen={false}>
	<DeviceSelectorContents
		{currentAudioDeviceId}
		{currentVideoDeviceId}
		onAudioDeviceSelected={handleAudioDeviceSelected}
		onVideoDeviceSelected={handleVideoDeviceSelected}
	/>
</Accordion>

<style>
	.label {
		text-align: center;
		font-weight: 400;
	}

	.user-role {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		font-size: 0.8em;
		color: #9a9a9a;
		font-style: italic;
		margin-bottom: 16px;
	}

	.user-role .icon {
		color: #9a9a9a;
	}
</style>
