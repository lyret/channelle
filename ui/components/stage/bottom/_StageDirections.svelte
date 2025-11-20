<script lang="ts">
	import { slide } from "svelte/transition";
	import IconAlertTriangle from "~/components/icons/Icon-alert-triangle.svelte";
	import { videoProducer, audioProducer, camPausedStore, micPausedStore, peerStore } from "~/api/media";
	import { showSceneSettingsStore } from "~/api";

	$: isCameraOn = !!$videoProducer && !$camPausedStore;
	$: isMicOn = !!$audioProducer && !$micPausedStore;
	$: isActor = $peerStore.actor;
	$: isOnStage = isActor && !$showSceneSettingsStore.curtains;
	$: isCameraOffStage = isOnStage && !isCameraOn;
	$: isMicOffStage = isOnStage && !isMicOn;
	$: visible = isCameraOffStage || isMicOffStage;
</script>

{#if visible}
	<span class="tag mt-1 mr-2 is-large" transition:slide>
		<span class="icon pr-2"><IconAlertTriangle /></span>&nbsp;
		{#if isCameraOffStage && isMicOffStage}
			Du är på scen! Slå på din kamera och mikrofon.
		{:else if isCameraOffStage}
			Du är på scen! Slå på din kamera.
		{:else if isMicOffStage}
			Du är på scen! Slå på din mikrofon.
		{/if}
	</span>
{/if}

<style lang="scss">
	.tag {
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
	}
</style>
