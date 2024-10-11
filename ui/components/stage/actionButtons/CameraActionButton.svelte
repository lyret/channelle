<script lang="ts">
	import { blur } from 'svelte/transition';
	import { currentParticipant } from '~/lib/stores/api';
	import { localMedia } from '~/lib/stores/localMedia';

	$: isOn = !!$localMedia.video.stream && !$localMedia.video.paused;
	$: isBlocked = $localMedia.video.blocked;
	$: errorMessage = $localMedia.video.err;
	$: hasError = !!$localMedia.video.err;

	export let minimal: boolean = false;
</script>

{#if $currentParticipant.actor || $currentParticipant.manager}
	<button
		type="button"
		disabled={isBlocked}
		class="button is-small"
		transition:blur
		on:click={() =>
			!isOn ? localMedia.startVideoStream() : localMedia.pauseVideoStream()}
	>
		<span
			class="icon is-size-4"
			class:has-text-danger={hasError}
			class:has-text-success={isOn}
			><ion-icon name={isOn ? 'videocam' : 'videocam-off'}></ion-icon></span
		>
		{#if !minimal}
			<span
				>Kamera ({errorMessage ||
					(isBlocked && 'ej tillgänglig') ||
					(isOn ? 'på' : 'av')})</span
			>
		{/if}
	</button>
{/if}
