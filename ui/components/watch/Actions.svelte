<script lang="ts">
	import { update } from '~/api';
	import { currentParticipant } from '~/stores/connection';
	import { media } from '~/stores/media';

	export let left: any;
	export let right: any;

	// FIXME: re-add
	// socket.on("newProducer", () => {
	// AfsSubscribe.disabled = false;
	//});

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
		on:click={() => media.publish('camera')}
	>
		<span class="icon"><ion-icon name="videocam-outline"></ion-icon></span>
		<span>Publish</span>
	</button>
	<button type="button" class={btnClassList} on:click={() => media.consume()}>
		<span class="icon"><ion-icon name="videocam-outline"></ion-icon></span>
		<span>Watch</span>
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
