<script lang="ts">
	import { currentParticipant } from '~/lib/stores/api';
	import ManagerMenuPanel from './ManagerMenuPanel.svelte';
	import { localMedia } from '~/lib/stores/localMedia';

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
</script>

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
		<span class="icon"><ion-icon name="mic-outline"></ion-icon></span>
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
		<span class="icon"><ion-icon name="videocam-outline"></ion-icon></span>
	</div>
</div>
<hr />
{#if $currentParticipant.manager}
	<ManagerMenuPanel />
{/if}
