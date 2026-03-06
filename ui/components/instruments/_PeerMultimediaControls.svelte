<script lang="ts">
	import { beforeUpdate } from "svelte";
	import type { ClientPeerAttributes } from "~/types/serverSideTypes";
	import IconMic from "~/components/icons/Icon-mic.svelte";
	import IconMicOff from "~/components/icons/Icon-mic-off.svelte";
	import IconVideo from "~/components/icons/Icon-video.svelte";
	import IconVideoOff from "~/components/icons/Icon-video-off.svelte";
	import { roomConnection } from "~/api/stage/roomManager";
	import type { PeerMediaState } from "~/api";

	export let peer: ClientPeerAttributes;
	export let mediaState: PeerMediaState;
	export let loading: boolean = false;
	export let doUpdate: (peer: ClientPeerAttributes, data: any) => Promise<void>;

	let videoButtonClass = "is-light";
	let videoButtonStatusTitle = "Video";
	let videoButtonActionTitle = "- klicka för att ändra";
	let videoIsOff = false;

	let audioButtonClass = "is-light";
	let audioButtonStatusTitle = "Ljud";
	let audioButtonActionTitle = "- klicka för att ändra";
	let audioIsOff = false;

	$: isConnected = $roomConnection;

	$: if (mediaState) {
		videoButtonClass = "";
		if (mediaState.videoMuted) {
			videoButtonClass = "is-light has-text-danger";
			videoIsOff = true;
			videoButtonStatusTitle = "Video stoppas";
			videoButtonActionTitle = "- klicka för att tillåta";
		} else {
			videoIsOff = false;
			videoButtonStatusTitle = "Video tillåts";
			videoButtonActionTitle = "- klicka för att stoppa";

			if (isConnected && mediaState.isReceivingVideo) {
				videoIsOff = false;
				videoButtonClass = "has-text-success";
				videoButtonStatusTitle = "Video tas emot";
			} else if (isConnected && mediaState.isCurrentPeer && mediaState.hasLocalVideoTrack && mediaState.isTransmittingVideo) {
				videoButtonClass = "has-text-success";
				videoButtonStatusTitle = "Video aktiv och sänds";
			} else if (isConnected && mediaState.isCurrentPeer && mediaState.hasLocalVideoTrack) {
				videoButtonClass = "has-text-warning";
				videoButtonStatusTitle = "Din Video är aktiv";
			} else if (isConnected && mediaState.isTransmittingVideo) {
				videoIsOff = false;
				videoButtonClass = "has-text-warning";
				videoButtonStatusTitle = "Video sänds men tas ej emot här";
			} else if ((mediaState?.isOnStage && (mediaState.isActor || mediaState.isManager)) || mediaState?.visitorVideoEnabled) {
				videoIsOff = true;
				videoButtonStatusTitle = "Video tillåten";
			} else {
				videoIsOff = true;
				videoButtonStatusTitle = "Video ej tillåten just nu";
			}
		}

		audioButtonClass = "";
		if (mediaState.audioMuted) {
			audioButtonClass = "is-light has-text-danger";
			audioIsOff = true;
			audioButtonStatusTitle = "Ljud stoppas";
			audioButtonActionTitle = "- klicka för att tillåta";
		} else {
			audioIsOff = false;
			audioButtonStatusTitle = "Ljud tillåts";
			audioButtonActionTitle = "- klicka för att stoppa";

			if (isConnected && mediaState.isReceivingAudio) {
				audioIsOff = false;
				audioButtonClass = "has-text-success";
				audioButtonStatusTitle = "Ljud tas emot";
			} else if (isConnected && mediaState.isCurrentPeer && mediaState.hasLocalAudioTrack && mediaState.isTransmittingAudio) {
				audioButtonClass = "has-text-success";
				audioButtonStatusTitle = "Ljud aktiv och sänds";
			} else if (isConnected && mediaState.isCurrentPeer && mediaState.hasLocalAudioTrack) {
				audioButtonClass = "has-text-warning";
				audioButtonStatusTitle = "Ditt Ljud är aktiv";
			} else if (isConnected && mediaState.isTransmittingAudio) {
				audioIsOff = false;
				audioButtonClass = "has-text-warning";
				audioButtonStatusTitle = "Ljud sänds men tas ej emot här";
			} else if ((mediaState?.isOnStage && mediaState.isActor) || mediaState.isManager || mediaState?.visitorAudioEnabled) {
				audioIsOff = true;
				audioButtonStatusTitle = "Ljud tillåten";
			} else {
				audioIsOff = true;
				audioButtonStatusTitle = "Ljud ej tillåten just nu";
			}
		}
	}
</script>

<button
	class={`button is-small ${videoButtonClass}`}
	title={`${videoButtonStatusTitle} ${videoButtonActionTitle}`}
	disabled={loading}
	on:click={() => doUpdate(peer, { videoMuted: !mediaState.videoMuted })}
>
	<span class={`icon ${videoButtonClass}`}>
		{#if videoIsOff}
			<IconVideoOff />
		{:else}
			<IconVideo />
		{/if}
	</span>
</button>
<button
	class={`button is-small ${audioButtonClass}`}
	title={`${audioButtonStatusTitle} ${audioButtonActionTitle}`}
	disabled={loading}
	on:click={() => doUpdate(peer, { audioMuted: !mediaState.audioMuted })}
>
	<span class={`icon ${audioButtonClass}`}>
		{#if audioIsOff}
			<IconMicOff />
		{:else}
			<IconMic />
		{/if}
	</span>
</button>
