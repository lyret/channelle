<script lang="ts">
	import IconMeh from "~/components/icons/Icon-meh.svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import IconVideo from "~/components/icons/Icon-video.svelte";
	import { peerStore, updatePeerName } from "~/api/media";

	let isLoading = false;
	let audioDevices: MediaDeviceInfo[] = [];
	let videoDevices: MediaDeviceInfo[] = [];
	let selectedAudioDevice: string = "";
	let selectedVideoDevice: string = "";

	const loadDevices = async () => {
		isLoading = true;
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			audioDevices = devices.filter((device) => device.kind === "audioinput");
			videoDevices = devices.filter((device) => device.kind === "videoinput");
		} catch (error) {
			console.error("Error loading devices:", error);
		} finally {
			isLoading = false;
		}
	};

	const onSelectVideo = (event: any) => {
		selectedVideoDevice = event.target.value;
	};

	const onSelectAudio = (event: any) => {
		selectedAudioDevice = event.target.value;
	};

	async function updateName() {
		const currentName = $peerStore.name;
		const newName = window.prompt("Byt namn till...", currentName) || currentName;
		if (newName && newName !== currentName) {
			await updatePeerName($peerStore.id, newName);
		}
	}
</script>

<p class="label">Ändra ditt namn</p>
<!-- CURRENT USER -->
<button class="button is-fullwidth mb-4 is-rounded" on:click={updateName}>
	<span class="icon"><IconMeh /></span>
	<span>{$peerStore?.name} </span>
</button>
<p class="label">Välj din kamera- och mikrofon- ingång</p>
<div class="control has-icons-left">
	<div class="select is-fullwidth mb-4 is-rounded" class:is-loading={isLoading}>
		<select on:mousedown={loadDevices} on:change={onSelectAudio}>
			<option value="" class="has-text-gray">Standardmikrofonen</option>
			{#each audioDevices as device (device.deviceId)}
				<option value={device.deviceId} selected={selectedAudioDevice === device.deviceId}>
					{device.label || `Mikrofon ${audioDevices.indexOf(device) + 1}`}
				</option>
			{/each}
		</select>
		<span class="icon"><IconMic /></span>
	</div>
</div>
<div class="control has-icons-left">
	<div class="select is-fullwidth mb-4 is-rounded" class:is-loading={isLoading}>
		<select on:mousedown={loadDevices} on:change={onSelectVideo}>
			<option value="" class="has-text-gray">Standardkameran</option>
			{#each videoDevices as device (device.deviceId)}
				<option value={device.deviceId} selected={selectedVideoDevice === device.deviceId}>
					{device.label || `Kamera ${videoDevices.indexOf(device) + 1}`}
				</option>
			{/each}
		</select>
		<span class="icon"><IconVideo /></span>
	</div>
</div>

<style>
	.label {
		text-align: center;
		font-weight: 400;
	}
</style>
