<script lang="ts">
	import { slide } from "svelte/transition";
	import { localPeerMediaState } from "~/api/stage";
	import IconAward from "../../icons/Icon-award.svelte";
	import IconBriefcase from "../../icons/Icon-briefcase.svelte";

	// Use the local peer media state directly
	$: mediaState = $localPeerMediaState;

	// Actor/Manager indicator
	let showActorIndicator = false;
	let actorIndicatorIcon = IconAward;
	let actorIndicatorText = "Skådespelare";

	$: if (mediaState?.isCurrentPeer) {
		if (mediaState.isActor || mediaState.isManager) {
			showActorIndicator = true;
			actorIndicatorIcon = mediaState.isManager ? IconBriefcase : IconAward;
			actorIndicatorText = mediaState.isManager ? "Tekniker" : "Skådespelare";
		}
	}

	// STAGE DIRECTION
	let showStageDirection = false;
	let cameraIsWanted = false;
	let micIsWanted = false;
	let stageDirectionMessage = "";
	let stageDirectionClass = "";

	$: console.log({ mediaState });

	// SKÅDESPELARE ÖNSKAD PÅ SCEN
	$: if (mediaState) {
		showStageDirection = false;
		cameraIsWanted = false;
		micIsWanted = false;
		if (mediaState?.isOnStage && (mediaState.isActor || mediaState.isManager)) {
			if (!mediaState.hasLocalVideoTrack || !mediaState.hasLocalAudioTrack) {
				stageDirectionClass = "is-warning";

				if (!mediaState.hasLocalVideoTrack && !mediaState.hasLocalAudioTrack) {
					stageDirectionMessage = "Du är önskad på scen! Slå på din kamera och mikrofon.";
					cameraIsWanted = true;
					micIsWanted = true;
					showStageDirection = true;
				} else if (!mediaState.hasLocalVideoTrack) {
					stageDirectionMessage = "Du är önskad på scen! Slå på din kamera.";
					showStageDirection = true;
					cameraIsWanted = true;
				} else if (!mediaState.hasLocalAudioTrack) {
					stageDirectionMessage = "Pssst. Din mikrofon är avstängd.";
					showStageDirection = true;
					micIsWanted = true;
				}
			}
			// IS WELCOME ON STAGE
		} else if (mediaState?.visitorVideoEnabled || mediaState?.visitorAudioEnabled) {
			stageDirectionClass = "is-primary";

			if (!mediaState.hasLocalVideoTrack && mediaState.visitorVideoEnabled && !mediaState.hasLocalAudioTrack && mediaState.visitorAudioEnabled) {
				stageDirectionMessage = "Välkommen att slå på din kamera och mikrofon";
				showStageDirection = true;
				cameraIsWanted = true;
				micIsWanted = true;
			} else if (mediaState.isAutoLayout && !mediaState.hasLocalVideoTrack && mediaState.visitorVideoEnabled) {
				stageDirectionMessage = "Välkommen att slå på din kamera";
				showStageDirection = true;
				cameraIsWanted = true;
			} else if (!mediaState.hasLocalAudioTrack && mediaState.visitorAudioEnabled) {
				stageDirectionMessage = "Välkommen att slå på din mikrofon";
				showStageDirection = true;
				micIsWanted = true;
			}
		} else if (mediaState?.isManager && !mediaState.audioMuted) {
			stageDirectionClass = "is-light";
			stageDirectionMessage = "Som tekniker kan du alltid sända ditt ljud";
			showStageDirection = true;
		}
	}
	$: if (cameraIsWanted && mediaState?.videoMuted && showStageDirection) {
		stageDirectionClass = "is-warning";
		stageDirectionMessage = "Teknikerna har stängt av din video";
	}
	$: if (micIsWanted && mediaState?.audioMuted && showStageDirection) {
		stageDirectionClass = "is-warning";
		stageDirectionMessage = "Teknikerna har stängt av din mikrofon";
	}
</script>

<!-- Actor/Manager indicator -->
{#if showActorIndicator}
	<span class="tag is-info mt-1 mr-2 is-large actor-indicator" transition:slide>
		<span class="icon is-small">
			<svelte:component this={actorIndicatorIcon} />
		</span>
		<span>{actorIndicatorText}</span>
	</span>
{/if}

<!-- Stage directions -->
{#if showStageDirection}
	<span class="tag {stageDirectionClass} mt-1 mr-2 is-large" transition:slide>
		{stageDirectionMessage}
	</span>
{/if}

<style>
	.actor-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>
