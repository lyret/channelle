<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { blur } from "svelte/transition";
	import * as roomClient from "~/api/room/roomClient";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { SessionStats, PeerMediaStatus, ConnectionStatus } from "~/components/debug";

	// Import all the stores from roomClient
	import {
		localMediaStream,
		consumersStore,
		peersStore,
		peerStore,
		sessionsStore,
		hasJoinedRoomStore,
		hasLocalCamStore,
		hasSendTransportStore,
		recvTransports,
		videoProducer,
		audioProducer,
		currentActiveSpeakerStore,
		camPausedStore,
		micPausedStore,
	} from "~/api/room/roomClient";

	// Local state for UI
	let newPasswordInput = "";
	let peerNameInput = "";
	let targetPeerId = "";

	// Video element refs
	let localCamVideo: HTMLVideoElement;
	const consumerVideos: { [key: string]: HTMLVideoElement } = {};

	// Reactive statements for essential functionality
	$: myPeerId = $wsPeerIdStore;
	$: joined = $hasJoinedRoomStore;
	$: peer = $peerStore;
	$: hasLocalCam = $hasLocalCamStore;
	$: hasSendTransport = $hasSendTransportStore;
	$: hasCamVideo = !!$videoProducer;
	$: hasCamAudio = !!$audioProducer;
	$: activeSpeaker = $currentActiveSpeakerStore?.peerId || "None";
	$: consumers = $consumersStore;
	$: peers = $peersStore;
	$: sessions = $sessionsStore;
	$: peersList = Object.entries(peers).map(([peerId, info]) => ({
		peerId,
		...info,
		hasTransport: $recvTransports[peerId] !== undefined,
		session: sessions[peerId],
	}));

	// Paused states
	$: camVideoPaused = $camPausedStore;
	$: camAudioPaused = $micPausedStore;

	// Update video elements when streams change
	$: if (localCamVideo && $localMediaStream) {
		localCamVideo.srcObject = $localMediaStream;
		localCamVideo.play().catch((e) => console.error("Error playing local camera:", e));
	} else if (localCamVideo && !$localMediaStream) {
		localCamVideo.srcObject = null;
	}

	// Update consumer videos when consumers change
	$: {
		consumers.forEach((consumer) => {
			const key = `${consumer.appData.peerId}-${consumer.appData.mediaTag}`;
			if (consumer.track && consumer.track.kind === "video") {
				const videoElement = consumerVideos[key];
				if (videoElement) {
					try {
						const stream = new MediaStream([consumer.track]);
						videoElement.srcObject = stream;
						videoElement.play().catch((e) => {
							console.warn("[Debug] Video play failed for", key, e);
						});
					} catch (e) {
						console.error("[Debug] Error setting video source for", key, e);
					}
				}
			}
		});
	}

	onMount(() => {
		roomClient.joinRoom();
	});

	onDestroy(() => {
		roomClient.leaveRoom();
	});

	function getConsumerKey(consumer: any): string {
		return `${consumer.appData.peerId}-${consumer.appData.mediaTag}`;
	}

	function isVideoConsumer(consumer: any): boolean {
		return consumer.appData.mediaTag.includes("video");
	}

	function isAudioConsumer(consumer: any): boolean {
		return consumer.appData.mediaTag.includes("audio");
	}

	async function setStagePassword() {
		if (newPasswordInput.trim()) {
			await roomClient.setStagePassword(newPasswordInput.trim());
			newPasswordInput = "";
		} else {
			await roomClient.setStagePassword(undefined);
		}
	}

	async function updatePeerName() {
		if (targetPeerId && peerNameInput.trim()) {
			await roomClient.updatePeerName(targetPeerId, peerNameInput.trim());
			peerNameInput = "";
			targetPeerId = "";
		}
	}
</script>

<div class="container is-fluid" in:blur={{ delay: 500, duration: 1000 }}>
	<h1 class="title">🔍 Debug Dashboard</h1>

	<!-- Session Statistics Overview -->
	<SessionStats />

	<!-- My Peer Information -->
	<div class="box">
		<h2 class="subtitle">My Peer Information</h2>
		<div class="columns">
			<div class="column is-6">
				<ConnectionStatus peerId={myPeerId} peerData={peer} isOnline={joined} hasTransport={true} isMyPeer={true} />
			</div>
			<div class="column is-6">
				<PeerMediaStatus peerId={myPeerId} peerData={peer} sessionData={{ media: {} }} isActiveSpeaker={activeSpeaker === myPeerId} />
			</div>
		</div>
	</div>

	<!-- Stage Management -->
	<div class="box">
		<h2 class="subtitle">Stage Management</h2>
		<div class="field">
			<label class="label is-small" for="stage-password">Set Stage Password</label>
			<div class="field has-addons">
				<div class="control is-expanded">
					<input id="stage-password" class="input is-small" type="text" placeholder="New password (empty to remove)" bind:value={newPasswordInput} />
				</div>
				<div class="control">
					<button class="button is-small is-primary" on:click={setStagePassword}>Set Password</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Video Streams Section -->
	<div class="box">
		<h2 class="subtitle">Video Streams</h2>
		<div class="columns is-multiline">
			<!-- Local Camera -->
			{#if hasLocalCam}
				<div class="column is-4-desktop is-6-tablet">
					<div class="card">
						<div class="card-content p-2">
							<p class="subtitle is-6 mb-1">Local Camera</p>
							<video bind:this={localCamVideo} autoplay playsinline muted class="video-preview" class:is-paused={camVideoPaused} />
							<div class="tags are-small mt-1">
								<span class="tag" class:is-success={hasCamVideo && !camVideoPaused} class:is-warning={camVideoPaused}>
									Video Track: {hasCamVideo ? (camVideoPaused ? "Paused" : "Streaming") : "Not Streaming"}
								</span>
								<span class="tag" class:is-success={hasCamAudio && !camAudioPaused} class:is-warning={camAudioPaused}>
									Audio Track: {hasCamAudio ? (camAudioPaused ? "Paused" : "Streaming") : "Not Streaming"}
								</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Remote Consumer Videos -->
			{#each consumers.filter(isVideoConsumer) as consumer (getConsumerKey(consumer))}
				<div class="column is-4-desktop is-6-tablet">
					<div class="card" class:is-active-speaker={consumer.appData.peerId === activeSpeaker}>
						<div class="card-content p-2">
							<p class="subtitle is-6 mb-1">{consumer.appData.peerId}</p>
							<p class="is-size-7 has-text-grey">{consumer.appData.mediaTag}</p>
							<video
								bind:this={consumerVideos[getConsumerKey(consumer)]}
								autoplay
								playsinline
								muted
								controls={false}
								class="video-preview"
								class:is-paused={consumer.paused}
								on:loadeddata={() => console.log("[Debug] Video loadeddata for:", getConsumerKey(consumer))}
								on:canplay={() => console.log("[Debug] Video canplay for:", getConsumerKey(consumer))}
								on:error={(e) => console.error("[Debug] Video error for:", getConsumerKey(consumer), e)}
							/>
							<div class="tags are-small mt-1">
								<span class="tag" class:is-success={!consumer.paused} class:is-warning={consumer.paused}>
									Consumer: {consumer.paused ? "Paused" : "Receiving"}
								</span>
								{#if consumer.appData.peerId === activeSpeaker}
									<span class="tag is-primary">Speaking</span>
								{/if}
							</div>
							<div class="buttons are-small mt-1">
								<button
									class="button is-small is-warning"
									on:click={async () => {
										if (consumer.paused) {
											await roomClient.resumeConsumer(consumer);
										} else {
											await roomClient.pauseConsumer(consumer);
										}
									}}
								>
									{consumer.paused ? "Resume" : "Pause"}
								</button>
								<button
									class="button is-small is-danger"
									on:click={() => roomClient.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag)}
								>
									Close
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Audio-only consumers -->
		{#if consumers.filter(isAudioConsumer).length > 0}
			<div class="content">
				<p class="subtitle is-6">Audio Consumers</p>
				<div class="columns is-multiline">
					{#each consumers.filter(isAudioConsumer) as consumer (getConsumerKey(consumer))}
						<div class="column is-6">
							<div class="box p-2">
								<div class="level is-mobile mb-1">
									<div class="level-left">
										<span class="tag is-small" class:is-primary={consumer.appData.peerId === activeSpeaker}>
											{consumer.appData.peerId} - {consumer.appData.mediaTag}
											{#if consumer.appData.peerId === activeSpeaker}🔊{/if}
										</span>
									</div>
									<div class="level-right">
										<span class="tag is-small" class:is-success={!consumer.paused} class:is-warning={consumer.paused}>
											Consumer: {consumer.paused ? "Paused" : "Receiving"}
										</span>
									</div>
								</div>
								<div class="buttons are-small">
									<button
										class="button is-small is-warning"
										on:click={async () => {
											if (consumer.paused) {
												await roomClient.resumeConsumer(consumer);
											} else {
												await roomClient.pauseConsumer(consumer);
											}
										}}
									>
										{consumer.paused ? "Resume" : "Pause"}
									</button>
									<button
										class="button is-small is-danger"
										on:click={() => roomClient.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag)}
									>
										Close
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Peers Section -->
	<!-- All Peers Information -->
	<div class="box">
		<h2 class="subtitle">All Peers</h2>
		<div class="columns is-multiline">
			{#each peersList as peer (peer.peerId)}
				<div class="column is-6-tablet is-4-desktop">
					<ConnectionStatus
						peerId={peer.peerId}
						peerData={peer}
						isOnline={peer.online}
						hasTransport={peer.hasTransport}
						isMyPeer={peer.peerId === myPeerId}
					/>

					{#if peer.session?.media}
						<PeerMediaStatus peerId={peer.peerId} peerData={peer} sessionData={peer.session} isActiveSpeaker={peer.peerId === activeSpeaker} />
					{/if}
				</div>
			{/each}
		</div>

		{#if peersList.length === 0}
			<p class="has-text-grey">No peers connected</p>
		{/if}
	</div>

	<!-- Peer Management -->
	<div class="box">
		<h2 class="subtitle">Peer Management</h2>
		<div class="columns">
			<div class="column is-6">
				<div class="field">
					<label class="label is-small" for="peer-select">Update Peer Name</label>
					<div class="field is-grouped">
						<div class="control">
							<div class="select is-small">
								<select id="peer-select" bind:value={targetPeerId}>
									<option value="">Select Peer...</option>
									{#each peersList as peer (peer.peerId)}
										<option value={peer.peerId}>{peer.peerId} ({peer.name || "Unnamed"})</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="control is-expanded">
							<input id="peer-name-input" class="input is-small" type="text" placeholder="New name" bind:value={peerNameInput} />
						</div>
						<div class="control">
							<button class="button is-small is-primary" on:click={updatePeerName} disabled={!targetPeerId || !peerNameInput.trim()}>
								Update Name
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Controls Section -->
	<div class="box">
		<h2 class="subtitle">Controls</h2>

		<!-- Room Controls -->
		<div class="field">
			<span class="label is-small">Room Controls</span>
			<div class="buttons are-small">
				<button class="button is-primary" on:click={roomClient.joinRoom} disabled={joined}>Join Room</button>
				<button class="button is-danger" on:click={roomClient.leaveRoom} disabled={!joined}>Leave Room</button>
			</div>
		</div>

		<!-- Media Stream Controls -->
		<div class="field">
			<span class="label is-small">Media Stream Controls</span>
			<div class="buttons are-small">
				<button class="button is-info" on:click={() => roomClient.startLocalMediaStream(false, true)} disabled={hasLocalCam}>Video Only</button>
				<button class="button is-info" on:click={() => roomClient.startLocalMediaStream(true, false)} disabled={hasLocalCam}>Audio Only</button>
				<button class="button is-info" on:click={() => roomClient.startLocalMediaStream(true, true)} disabled={hasLocalCam}>Audio + Video</button>
				<button class="button is-success" on:click={roomClient.sendMediaStreams} disabled={!hasLocalCam || !joined}>Send Streams</button>
				<button class="button is-danger" on:click={roomClient.closeMediaStreams} disabled={!hasSendTransport}>Stop Sending</button>
			</div>
		</div>

		<!-- Producer Controls -->
		<div class="field">
			<span class="label is-small">Producer Controls</span>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={() => roomClient.toggleVideoPaused()} disabled={!hasCamVideo}>
					{camVideoPaused ? "Resume Video Producer" : "Pause Video Producer"}
				</button>
				<button class="button is-warning" on:click={() => roomClient.toggleAudioPaused()} disabled={!hasCamAudio}>
					{camAudioPaused ? "Resume Audio Producer" : "Pause Audio Producer"}
				</button>
			</div>
		</div>

		<!-- Consumer Controls -->
		<div class="field">
			<span class="label is-small">Consumer Controls</span>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={roomClient.resumeAllConsumers} disabled={consumers.length === 0}>Resume All Consumers</button>
				<button class="button is-warning" on:click={roomClient.pauseAllConsumers} disabled={consumers.length === 0}>Pause All Consumers</button>
				<button class="button is-danger" on:click={roomClient.closeAllConsumers} disabled={consumers.length === 0}>Close All Consumers</button>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.container {
		padding: 1rem;
	}

	.video-preview {
		width: 100%;
		height: auto;
		min-height: 120px;
		max-height: 200px;
		background: #000;
		border-radius: 4px;
		object-fit: cover;

		&.is-paused {
			opacity: 0.5;
		}
	}

	.card.is-active-speaker {
		border: 2px solid var(--bulma-primary);
	}

	.box {
		padding: 1rem;
	}

	.subtitle {
		margin-bottom: 0.75rem !important;
	}

	.field {
		margin-bottom: 1rem;
	}

	.label {
		margin-bottom: 0.25rem !important;
	}
</style>
