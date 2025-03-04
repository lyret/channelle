<script lang="ts">
	import { localMedia } from '~/lib/stores/producedMedia';
	import { update } from '~/lib';
	import { currentParticipant } from '~/lib/stores/api';
	import IconMeh from '~/components/icons/Icon-meh.svelte';
	import IconMic from '~/components/icons/Icon-mic.svelte';
	import IconVideo from '~/components/icons/Icon-video.svelte';

	let isLoading = false;
	let isUnloaded = true;

	const onLoadVideoDevices = async () => {
		if (isUnloaded) {
			isLoading = true;
			await localMedia.updateDeviceLists({ video: true });
			isUnloaded = false;
			isLoading = false;
		}
	};
	const onLoadAudioDevices = async () => {
		if (isUnloaded) {
			isLoading = true;
			await localMedia.updateDeviceLists({
				audio: true,
			});
			isUnloaded = false;
			isLoading = false;
		}
	};
	const onSelectVideo = (event: any) => {
		if (event.target.value > -1) {
			localMedia.selectVideoDevice($localMedia.video.list[event.target.value]);
		} else if (event.target.value == -1) {
			localMedia.selectVideoDevice(undefined);
		}
	};
	const onSelectAudio = (event: any) => {
		if (event.target.value > -1) {
			localMedia.selectAudioDevice($localMedia.audio.list[event.target.value]);
		} else if (event.target.value == -1) {
			localMedia.selectAudioDevice(undefined);
		}
	};

	async function updateName() {
		const currentName = $currentParticipant.name;
		const newName =
			window.prompt('Byt namn till...', currentName) || currentName;
		await update('participant', {
			where: { id: $currentParticipant.id },
			data: { name: newName },
		});
	}
</script>

<p class="label">Ändra ditt namn</p>
<!-- CURRENT USER -->
<button class="button is-fullwidth mb-4 is-rounded" on:click={updateName}>
	<span class="icon"><IconMeh /></span>
	<span>{$currentParticipant?.name} </span>
</button>
<p class="label">Välj din kamera- och mikrofon- ingång</p>
<div class="control has-icons-left">
	<div class="select is-fullwidth mb-4 is-rounded" class:is-loading={isLoading}>
		<select on:mousedown={onLoadAudioDevices} on:change={onSelectAudio}>
			{#if !$localMedia.audio.list.length && $localMedia.audio.selected}
				<option value={-2} selected={true}
					>{$localMedia.audio.selected.label}</option
				>
			{:else}
				<option value={-1} class="has-text-gray"> Standardmikrofonen</option>
				{#each $localMedia.audio.list as audioDevice, index}
					<option
						value={index}
						selected={$localMedia.audio.selected &&
							audioDevice.deviceId == $localMedia.audio.selected.deviceId}
						>{audioDevice.label}</option
					>
				{/each}
			{/if}
		</select>
		<span class="icon"><IconMic /></span>
	</div>
</div>
<div class="control has-icons-left">
	<div class="select is-fullwidth mb-4 is-rounded" class:is-loading={isLoading}>
		<select on:mousedown={onLoadVideoDevices} on:change={onSelectVideo}>
			{#if !$localMedia.video.list.length && $localMedia.video.selected}
				<option value={-2} selected={true}
					>{$localMedia.video.selected.label}</option
				>
			{:else}
				<option value={-1} class="has-text-gray">Standardkameran</option>
				{#each $localMedia.video.list as videoDevice, index}
					<option
						value={index}
						selected={$localMedia.video.selected &&
							videoDevice.deviceId == $localMedia.video.selected.deviceId}
						>{videoDevice.label}</option
					>
				{/each}
			{/if}
		</select>
		<span class="icon"><IconVideo /></span>
	</div>
</div>
<hr />

<style>
	.label {
		text-align: center;
		font-weight: 400;
	}
</style>
