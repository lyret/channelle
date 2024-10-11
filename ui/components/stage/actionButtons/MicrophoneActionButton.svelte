<script lang="ts">
	import { blur } from 'svelte/transition';
	import { currentParticipant } from '~/lib/stores/api';
	import { localMedia } from '~/lib/stores/localMedia';

	$: isOn = !!$localMedia.audio.stream && !$localMedia.audio.paused;
	$: isBlocked = $localMedia.audio.blocked;
	$: errorMessage = $localMedia.audio.err;
	$: hasError = !!$localMedia.audio.err;

	export let minimal: boolean = false;
</script>

{#if $currentParticipant.actor || $currentParticipant.manager}
	<button
		type="button"
		disabled={isBlocked}
		class="button is-small"
		transition:blur
		on:click={() =>
			!isOn ? localMedia.startAudioStream() : localMedia.pauseAudioStream()}
	>
		<span
			class="icon is-size-4"
			class:has-text-danger={hasError}
			class:has-text-success={isOn}
			><ion-icon name={isOn ? 'mic' : 'mic-off'}></ion-icon></span
		>
		{#if !minimal}
			<span
				>Mikrofon ({errorMessage ||
					(isBlocked && 'ej tillgänglig') ||
					(isOn ? 'på' : 'av')})</span
			>
		{/if}
	</button>
{/if}
