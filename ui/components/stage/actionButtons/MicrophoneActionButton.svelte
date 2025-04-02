<script lang="ts">
	import { blur } from "svelte/transition";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import { currentParticipant } from "~/lib/stores/api";
	import { localMedia } from "~/lib/stores/producedMedia";
	import { sceneVisitorAudioIsEnabled } from "~/stores/scene/sceneVisitorAudioIsEnabled";

	$: isOn = !!$localMedia.audio.stream && !$localMedia.audio.paused;
	$: isBlocked = $localMedia.audio.blocked;
	$: isWanted = $localMedia.audio.wanted;
	$: errorMessage = $localMedia.audio.err;
	$: hasError = !!$localMedia.audio.err;

	export let minimal: boolean = false;
</script>

{#if $currentParticipant.actor || $currentParticipant.manager || $sceneVisitorAudioIsEnabled}
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
			class:has-text-success={isOn && isWanted}
			class:has-text-warning={isOn && !isWanted}
			>{#if isOn}
				<IconMic />
			{:else}
				<IconMicOff />
			{/if}</span
		>
		{#if !minimal}
			<span
				>Mikrofon:
				{#if errorMessage}
					{errorMessage}
				{:else if isBlocked}
					bannad
				{:else if isOn}
					på
				{:else}
					av
				{/if}
			</span>
		{/if}
	</button>
{/if}

<style lang="scss">
	.button {
		border-radius: 0;
		border: none;
		padding: 12px;
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);
	}
</style>
