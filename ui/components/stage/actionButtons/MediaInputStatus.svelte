<script lang="ts">
	import { slide } from "svelte/transition";
	import IconAlertTriangle from "~/components/icons/Icon-alert-triangle.svelte";
	import { localMedia } from "~/lib/stores/producedMedia";
	import { sceneCurtains } from "~/stores/scene/sceneCurtains";

	$: isCameraOn = !!$localMedia.video.stream && !$localMedia.video.paused;
	$: isMicOn = !!$localMedia.audio.stream && !$localMedia.audio.paused;
	$: isCameraWanted = !isCameraOn && $localMedia.video.wanted;
	$: isMicWanted = !isMicOn && $localMedia.audio.wanted;
	$: isCameraUnwanted = isCameraOn && !$localMedia.video.wanted;
	$: isMicUnwanted = isMicOn && !$localMedia.audio.wanted;
	$: isCameraBlocked = isCameraWanted && $localMedia.video.blocked;
	$: isMicBlocked = isMicWanted && $localMedia.audio.blocked;
	$: visible =
		!$sceneCurtains &&
		(isMicUnwanted || isCameraUnwanted || isMicWanted || isCameraWanted);
	$: isUrgent = isCameraWanted || isMicWanted;
</script>

{#if visible}
	<span class="tag mt-1 mr-2 is-large" transition:slide>
		<span class="icon pr-2"><IconAlertTriangle /></span>&nbsp;
		{#if isCameraBlocked && isMicBlocked}
			Din kamera och mikrofon är inte tillåten.
		{:else if isCameraBlocked}
			Din kamera är inte tillåten.
		{:else if isMicBlocked}
			Din mikrofon är inte tillåten.
		{:else if isCameraUnwanted && isMicUnwanted}
			Du är ej på scen och syns/hörs inte just nu.
		{:else if isCameraUnwanted}
			Du är ej på scen och syns inte just nu.
		{:else if isMicUnwanted}
			Du är ej på scen och hörs inte just nu.
		{:else if isCameraWanted && isMicWanted}
			Du är begärd på scen! Slå på din kamera och mikrofon.
		{:else if isCameraWanted}
			Din bild är begärd på scen! Slå på din kamera.
		{:else if isMicWanted}
			Din röst är önskad på scen! Slå på din mikrofon.
		{/if}
	</span>
{/if}

<style lang="scss">
	.tag {
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
	}
	.tag.urgent {
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
	}
</style>
