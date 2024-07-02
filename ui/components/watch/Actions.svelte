<script lang="ts">
	import { update, MediaSubscription } from '~/api';
	import { createMediaStore } from '~/stores';
	import { currentParticipant } from '~/stores/connection';

	export let left: any;
	export let right: any;

	const isProducingVideo = createMediaStore('isProducingVideo');
	const isProducingAudio = createMediaStore('isProducingAudio');

	async function updateName() {
		if ($currentParticipant) {
			const currentName = $currentParticipant.name;
			const newName = window.prompt('New name', currentName) || currentName;
			await update('participant', {
				where: { id: $currentParticipant.id },
				data: { name: newName },
			});
		}
	}
	const btnClassList = 'button is-primary';
</script>

<div class="buttons has-addons is-centered">
	<button class={btnClassList} on:click={left}>
		<span class="icon"
			><ion-icon name="arrow-back-circle-outline"></ion-icon></span
		>
	</button>
	<button class={btnClassList} on:click={updateName}>
		<span class="icon"><ion-icon name="person-circle-outline"></ion-icon></span>
		<span>{$currentParticipant?.name} </span></button
	>
	<button
		type="button"
		class={btnClassList}
		class:has-text-danger={$isProducingVideo}
		on:click={() =>
			$isProducingVideo
				? isProducingVideo.stopPublishVideo()
				: isProducingVideo.publishVideo()}
	>
		<span class="icon"
			><ion-icon name={$isProducingVideo ? 'videocam-off' : 'videocam'}
			></ion-icon></span
		>
		<span>{$isProducingVideo ? 'Stäng av kamera' : 'Starta kamera'}</span>
	</button>
	<button
		type="button"
		class={btnClassList}
		class:has-text-danger={$isProducingAudio}
		on:click={() =>
			$isProducingAudio
				? isProducingAudio.stopPublishAudio()
				: isProducingAudio.publishAudio()}
	>
		<span class="icon"
			><ion-icon name={$isProducingAudio ? 'mic-off' : 'mic'}></ion-icon></span
		>
		<span
			>{$isProducingAudio ? 'Stäng av mikrofonen' : 'Starta mikrofonen'}</span
		>
	</button>
	<!-- <button class="button icon" use:fullScreenAction>
			<ion-icon name="expand-outline"></ion-icon>
			<span>Fullscreen</span>
		</button> -->
	<button class={btnClassList} on:click={right}>
		<span class="icon"
			><ion-icon name="arrow-forward-circle-outline"></ion-icon></span
		>
	</button>
</div>

<!-- <div>
		<button id="btn_screen" on:click={() => {
			// TODO: Make display media passable so that its permitted
			console.log(navigator.mediaDevices.getDisplayMedia({
			  video: true,
			}));
			api.publish("screen")}} >Share Screen</button>
		<span id="screen_status"></span>
	</div> -->
