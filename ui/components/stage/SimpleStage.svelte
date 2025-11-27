<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import VideoSimple from "./elements/VideoSimple.svelte";
	import AudioSimple from "./elements/AudioSimple.svelte";
	import {
		joinRoom,
		leaveRoom,
		enableCamera,
		disableCamera,
		enableMicrophone,
		disableMicrophone,
		peerStreamsStore,
		sessionsStore,
		activeSpeakerStore,
		isLoadingStore,
		errorStore,
	} from "~/api/stageNew";
	import { wsPeerIdStore } from "~/api/_trpcClient";

	// Local state
	let isInRoom = false;
	let isCameraOn = false;
	let isMicOn = false;

	// Get reactive stores
	$: myPeerId = $wsPeerIdStore;
	$: isLoading = $isLoadingStore;
	$: error = $errorStore;
	$: sessions = $sessionsStore;
	$: streams = $peerStreamsStore;
	$: activeSpeaker = $activeSpeakerStore;

	// Get list of peer IDs to display
	$: peerIds = Object.keys(sessions).filter(id => {
		// Include peer if they have a stream or if it's the local peer
		return streams[id] || id === myPeerId;
	});

	// Room management
	async function handleJoinRoom() {
		try {
			await joinRoom();
			isInRoom = true;
		} catch (err) {
			console.error("Failed to join room:", err);
		}
	}

	async function handleLeaveRoom() {
		try {
			await leaveRoom();
			isInRoom = false;
			isCameraOn = false;
			isMicOn = false;
		} catch (err) {
			console.error("Failed to leave room:", err);
		}
	}

	// Camera management
	async function handleToggleCamera() {
		try {
			if (isCameraOn) {
				await disableCamera();
				isCameraOn = false;
			} else {
				await enableCamera();
				isCameraOn = true;
			}
		} catch (err) {
			console.error("Failed to toggle camera:", err);
		}
	}

	// Microphone management
	async function handleToggleMic() {
		try {
			if (isMicOn) {
				await disableMicrophone();
				isMicOn = false;
			} else {
				await enableMicrophone();
				isMicOn = true;
			}
		} catch (err) {
			console.error("Failed to toggle microphone:", err);
		}
	}

	// Cleanup on destroy
	onDestroy(() => {
		if (isInRoom) {
			leaveRoom();
		}
	});
</script>

<div class="stage-container">
	<!-- Header with controls -->
	<div class="control-bar">
		<div class="level">
			<div class="level-left">
				<div class="level-item">
					<h1 class="title is-4 has-text-white mb-0">Simple Stage Demo</h1>
				</div>
				{#if myPeerId}
					<div class="level-item">
						<span class="tag is-info">ID: {myPeerId.slice(0, 8)}</span>
					</div>
				{/if}
				{#if activeSpeaker}
					<div class="level-item">
						<span class="tag is-warning">Speaker: {activeSpeaker.peerId.slice(0, 8)}</span>
					</div>
				{/if}
			</div>

			<div class="level-right">
				{#if !isInRoom}
					<div class="level-item">
						<button
							class="button is-primary"
							on:click={handleJoinRoom}
							disabled={isLoading}
							class:is-loading={isLoading}
						>
							Join Room
						</button>
					</div>
				{:else}
					<div class="level-item">
						<button
							class="button is-info"
							on:click={handleToggleCamera}
							disabled={isLoading}
						>
							{isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
						</button>
					</div>
					<div class="level-item">
						<button
							class="button is-info"
							on:click={handleToggleMic}
							disabled={isLoading}
						>
							{isMicOn ? "Mute Mic" : "Unmute Mic"}
						</button>
					</div>
					<div class="level-item">
						<button
							class="button is-danger"
							on:click={handleLeaveRoom}
							disabled={isLoading}
						>
							Leave Room
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Error display -->
	{#if error}
		<div class="notification is-danger">
			<button class="delete" on:click={() => $errorStore = null}></button>
			<strong>Error:</strong> {error}
		</div>
	{/if}

	<!-- Main stage area -->
	<div class="stage-area">
		{#if !isInRoom}
			<div class="hero is-fullheight-with-navbar">
				<div class="hero-body">
					<div class="container has-text-centered">
						<h1 class="title has-text-white">
							Welcome to Simple Stage
						</h1>
						<p class="subtitle has-text-white-ter">
							Click "Join Room" to start
						</p>
					</div>
				</div>
			</div>
		{:else if peerIds.length === 0}
			<div class="hero is-fullheight-with-navbar">
				<div class="hero-body">
					<div class="container has-text-centered">
						<h1 class="title has-text-white">
							Waiting for peers...
						</h1>
						<p class="subtitle has-text-white-ter">
							Enable your camera or microphone to appear
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="video-grid" class:single={peerIds.length === 1} class:dual={peerIds.length === 2}>
				{#each peerIds as peerId (peerId)}
					<div class="video-wrapper" class:is-speaking={activeSpeaker?.peerId === peerId}>
						<VideoSimple {peerId} />
						<AudioSimple {peerId} />
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Status bar -->
	<div class="status-bar">
		<div class="level">
			<div class="level-left">
				<div class="level-item">
					<span class="has-text-white-ter">
						Status: {isInRoom ? "Connected" : "Disconnected"} |
						Peers: {Object.keys(sessions).length} |
						Streams: {Object.keys(streams).length}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.stage-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--channelle-main-bg-color, #1a1a1a);
	}

	.control-bar {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.control-bar .title {
		margin-bottom: 0;
	}

	.stage-area {
		flex: 1;
		overflow: hidden;
		position: relative;
		padding: 1rem;
	}

	.video-grid {
		display: grid;
		gap: 1rem;
		height: 100%;
		width: 100%;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		grid-auto-rows: minmax(200px, 1fr);
	}

	.video-grid.single {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
	}

	.video-grid.dual {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}

	.video-wrapper {
		position: relative;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		overflow: hidden;
		transition: box-shadow 0.3s ease;
	}

	.video-wrapper.is-speaking {
		box-shadow: 0 0 20px 4px rgba(255, 193, 7, 0.6);
	}

	.status-bar {
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.5);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.875rem;
	}

	.hero {
		background: transparent;
	}

	.notification {
		margin: 1rem;
	}

	/* Responsive adjustments */
	@media screen and (max-width: 768px) {
		.video-grid {
			grid-template-columns: 1fr;
		}

		.control-bar .level {
			display: block;
		}

		.control-bar .level-left,
		.control-bar .level-right {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			margin-top: 0.5rem;
		}
	}
</style>
