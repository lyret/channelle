<script lang="ts">
	import { fullScreenAction } from 'svelte-legos';
	import { api, ConnectionStatus } from '~/api';
	import { currentUser } from '~/stores';
	import Icon from '~/tokens/icon.svelte';

	export let left: any;
	export let right: any;

	// TODO: re-add
	// socket.on("newProducer", () => {
	// AfsSubscribe.disabled = false;
	//});

	const updateName = async () => {
		const currentName = currentUser.get().name;
		const newName = window.prompt('New name', currentName) || currentName;
		// TODO: Re-add:
		// const newInfo = await api.request("users_update", {
		// 	name: newName,
		// });
		// if (newInfo.name) {
		// 	currentUser.update(newInfo);
		// }
	};

	$: enabled = $api.status.connection == ConnectionStatus.Connected;
</script>

<div class="btn-group variant-filled">
	<button type="button" class="btn variant-filled" on:click={left}>
		<Icon name="i-majesticons-arrow-left" />
	</button>
	<button
		type="button"
		class="btn variant-filled"
		disabled
		on:click={updateName}
	>
		<Icon name="i-majesticons-link" />
		<span>{$api.status.connection.toLowerCase()}</span>
	</button>
	<button
		type="button"
		class="btn variant-filled"
		disabled={!enabled}
		on:click={updateName}
	>
		<Icon name="i-majesticons-user" />
		<span>{$currentUser.name}</span>
	</button>
	<button
		type="button"
		class="btn variant-filled"
		disabled={!enabled}
		on:click={() => api.publish('camera')}
	>
		<Icon name="i-majesticons-camera" />
		<span>Publish</span>
	</button>
	<button
		type="button"
		class="btn variant-filled"
		disabled={!enabled}
		on:click={() => api.consume()}
	>
		<Icon name="i-majesticons-eye-line" />
		<span>Watch</span>
	</button>
	<button
		type="button"
		class="btn variant-filled"
		disabled={!enabled}
		use:fullScreenAction
	>
		<Icon name="i-majesticons-arrows-expand-full" />
		<span>Fullscreen</span>
	</button>
	<button type="button" class="btn variant-filled" on:click={right}>
		<Icon name="i-majesticons-arrow-right" />
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

<style lang="postcss"></style>
