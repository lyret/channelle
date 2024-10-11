<script lang="ts">
	import { blur } from 'svelte/transition';
	import { currentParticipant } from '~/lib/stores/api';
	import { localMedia } from '~/lib/stores/localMedia';

	$: isCameraOn = !!$localMedia.video.stream && !$localMedia.video.paused;
	$: isMicOn = !!$localMedia.audio.stream && !$localMedia.audio.paused;
	$: isCameraWanted = !isCameraOn && $localMedia.video.wanted;
	$: isMicWanted = !isMicOn && $localMedia.audio.wanted;
	$: isCameraUnwanted = isCameraOn && !$localMedia.video.wanted;
	$: isMicUnwanted = isMicOn && !$localMedia.audio.wanted;
	$: isCameraBlocked = isCameraWanted && $localMedia.video.blocked;
	$: isMicBlocked = isMicWanted && $localMedia.audio.blocked;
	$: visible =
		isMicUnwanted || isCameraUnwanted || isMicWanted || isCameraWanted;
	$: isUrgent = isCameraWanted || isMicWanted;
</script>

{#if visible}
	<span
		class="tag is-link mt-3 mr-2"
		transition:blur
		class:is-warning={isUrgent}
	>
		<span class="icon pr-2"><ion-icon name="warning-outline"></ion-icon></span>
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
