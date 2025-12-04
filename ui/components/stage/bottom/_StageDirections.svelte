<script lang="ts">
	import { slide } from "svelte/transition";
	import { localPeerMediaState } from "~/api/stageNew/peerMedia";

	// Use the local peer media state directly
	$: mediaState = $localPeerMediaState;
</script>

{#if mediaState?.isCurrentPeer}
	<!-- Check if actor/manager is wanted on stage -->
	{#if (mediaState.isActor || mediaState.isManager) && mediaState.isOnStage}
		{#if !mediaState.hasLocalVideoTrack || !mediaState.hasLocalAudioTrack}
			<span class="tag is-warning mt-1 mr-2 is-large" transition:slide>
				{#if !mediaState.hasLocalVideoTrack && !mediaState.hasLocalAudioTrack}
					Du är önskad på scen! Slå på din kamera och mikrofon.
				{:else if !mediaState.hasLocalVideoTrack}
					Du är önskad på scen! Slå på din kamera.
				{:else if !mediaState.hasLocalAudioTrack}
					Pssst. Din mikrofon är avstängd.
				{/if}
			</span>
		{/if}
		<!-- Check if visitor is welcome to participate -->
	{:else if mediaState.isVisitor || (!mediaState.isOnStage && (!mediaState.hasLocalAudioTrack || !mediaState.hasLocalVideoTrack))}
		{#if (!mediaState.hasLocalAudioTrack && mediaState.visitorAudioEnabled) || (mediaState.isAutoLayout && !mediaState.hasLocalVideoTrack && mediaState.visitorVideoEnabled)}
			<span class="tag is-primary mt-1 mr-2 is-large" transition:slide>
				{#if mediaState.isAutoLayout && !mediaState.hasLocalVideoTrack && mediaState.visitorVideoEnabled && !mediaState.hasLocalAudioTrack && mediaState.visitorAudioEnabled}
					Välkommen att slå på din kamera och mikrofon
				{:else if mediaState.isAutoLayout && !mediaState.hasLocalVideoTrack && mediaState.visitorVideoEnabled}
					Välkommen att slå på din kamera
				{:else if !mediaState.hasLocalAudioTrack && mediaState.visitorAudioEnabled}
					Välkommen att slå på din mikrofon
				{/if}
			</span>
		{/if}
	{/if}
{/if}
