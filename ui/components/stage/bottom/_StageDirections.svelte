<script lang="ts">
	import { slide } from "svelte/transition";
	import IconAlertTriangle from "~/components/icons/Icon-alert-triangle.svelte";
	import { peerStreamsStore } from "~/api/stageNew";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { currentPeerStore } from "~/api/auth";
	import { showSceneSettingsStore } from "~/api/backstage";
	import { calculatedStageLayoutStore } from "~/stores/stage";

	// Get local stream to check media status
	$: myPeerId = $wsPeerIdStore;
	$: localStream = $peerStreamsStore[myPeerId];

	// Check if camera and microphone are on
	$: isCameraOn = localStream?.getVideoTracks().some((track) => track.enabled) || false;
	$: isMicOn = localStream?.getAudioTracks().some((track) => track.enabled) || false;

	// Check if user is an actor and on stage
	// and determine if a warning should be shown
	$: isActor = $currentPeerStore?.actor || $currentPeerStore?.manager || false;

	// Check if the actor is actually in the stage layout
	$: isInLayout = (() => {
		if (!myPeerId) return false;

		// In auto layout mode, no one is requested in the layout
		if ($calculatedStageLayoutStore.isAutoLayout) {
			return false;
		}

		// In manual layout mode, check if peer is in the layout matrix
		const layout = $calculatedStageLayoutStore.layout;
		for (const row of layout) {
			for (const cell of row) {
				if (cell.type === "actor" && cell.peerId === myPeerId) {
					return true;
				}
			}
		}
		return false;
	})();

	$: isOnStage = isActor && isInLayout && !$showSceneSettingsStore?.curtains;
	$: isCameraOffStage = isOnStage && !isCameraOn;
	$: isMicOffStage = isOnStage && !isMicOn;
	$: isWanted = isCameraOffStage || isMicOffStage;

	// Check if auto layout is enabled and visitor audio/video is allowed
	$: isAutoLayout = $calculatedStageLayoutStore.isAutoLayout;
	$: isWelcomeWithAudio = (!isActor || !isWanted) && $showSceneSettingsStore?.visitorAudioEnabled && !isMicOn;
	$: isWelcomeWithVideo = isAutoLayout && (!isActor || !isWanted) && $showSceneSettingsStore?.visitorVideoEnabled && !isCameraOn;
	$: isWelcome = isWelcomeWithAudio || isWelcomeWithVideo;
</script>

{#if isWanted}
	<span class="tag is-warning mt-1 mr-2 is-large" transition:slide>
		{#if isCameraOffStage && isMicOffStage}
			Du är önskad på scen! Slå på din kamera och mikrofon.
		{:else if isCameraOffStage}
			Du är önskad på scen! Slå på din kamera.
		{:else if isMicOffStage}
			Du är önskad på scen! Slå på din mikrofon.
		{/if}
	</span>
{:else if isWelcome}
	<span class="tag is-primary mt-1 mr-2 is-large" transition:slide>
		{#if isWelcomeWithVideo && isWelcomeWithAudio}
			Välkommen att slå på din kamera och mikrofon
		{:else if isWelcomeWithVideo}
			Välkommen att slå på din kamera
		{:else if isWelcomeWithAudio}
			Välkommen att slå på din mikrofon
		{/if}
	</span>
{/if}
