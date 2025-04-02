<script lang="ts">
	import { blur } from "svelte/transition";
	import IconVideoOff from "~/components/picol/icons/Picol-video-remove.svelte";
	import IconVideo from "~/components/picol/icons/Picol-video-run.svelte";
	import { currentParticipant } from "~/lib/stores/api";
	import { localMedia } from "~/lib/stores/producedMedia";

	$: isOn = !!$localMedia.video.stream && !$localMedia.video.paused;
	$: isBlocked = $localMedia.video.blocked;
	$: isWanted = $localMedia.video.wanted;
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
			class:has-text-success={isOn && isWanted}
			class:has-text-warning={isOn && !isWanted}
			>{#if isOn}<IconVideo />{:else}<IconVideoOff />{/if}</span
		>
		{#if !minimal}
			<span
				>Kamera:
				{#if errorMessage}
					{errorMessage}
				{:else if isBlocked}
					bannad
				{:else if isOn}
					på
				{:else if !isOn}
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
