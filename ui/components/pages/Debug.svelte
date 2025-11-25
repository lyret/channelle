<script lang="ts">
	import { blur } from "svelte/transition";
	import * as authClient from "~/api/auth/authClient";
	import * as mediaClient from "~/api/media/mediaClient";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { SessionStats, PeerMediaStatus, ConnectionStatus } from "~/components/debug";

	// Import all the stores from roomClient
	import {
		localMediaStream,
		consumersStore,
		peersStore,
		currentPeerStore,
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
	} from "~/api";

	// Local state for UI

	let peerNameInput = "";
	let targetPeerId = "";

	// Video element refs
	let localCamVideo: HTMLVideoElement;
	const consumerVideos: { [key: string]: HTMLVideoElement } = {};

	// Reactive statements for essential functionality
	$: myPeerId = $wsPeerIdStore;
	$: joined = $hasJoinedRoomStore;
	$: peer = $currentPeerStore;
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

	// Keep track of consumer tracks to detect changes
	const consumerTrackMap = new Map();

	// Update consumer videos when consumers change
	$: updateConsumerVideos(consumers, consumerVideos);

	function updateConsumerVideos(consumerList: any[], videoElements: { [key: string]: HTMLVideoElement }) {
		const currentKeys = new Set();

		consumerList.forEach((consumer) => {
			const key = getConsumerKey(consumer);
			currentKeys.add(key);

			if (consumer.track && consumer.track.kind === "video") {
				const videoElement = videoElements[key];
				const lastTrackId = consumerTrackMap.get(key);

				// Check if this is a new track or track has changed
				if (videoElement && (!lastTrackId || lastTrackId !== consumer.track.id)) {
					console.log("[Debug] Assigning/updating stream to video element for:", key, "trackId:", consumer.track.id);
					try {
						const stream = new MediaStream([consumer.track]);
						videoElement.srcObject = stream;
						videoElement.play().catch((e) => {
							console.warn("[Debug] Video play failed for", key, e);
						});
						consumerTrackMap.set(key, consumer.track.id);
					} catch (e) {
						console.error("[Debug] Error setting video source for", key, e);
					}
				}
			}
		});

		// Clean up tracks for consumers that no longer exist
		consumerTrackMap.forEach((trackId, key) => {
			if (!currentKeys.has(key)) {
				consumerTrackMap.delete(key);
				const videoElement = videoElements[key];
				if (videoElement) {
					videoElement.srcObject = null;
				}
			}
		});
	}

	function getConsumerKey(consumer: any): string {
		return `${consumer.appData.peerId}-${consumer.appData.mediaTag}`;
	}

	function isVideoConsumer(consumer: any): boolean {
		return consumer.appData.mediaTag.includes("video");
	}

	function isAudioConsumer(consumer: any): boolean {
		return consumer.appData.mediaTag.includes("audio");
	}

	async function updatePeerName() {
		if (targetPeerId && peerNameInput.trim()) {
			await authClient.updatePeerName(targetPeerId, peerNameInput.trim());
			peerNameInput = "";
			targetPeerId = "";
		}
	}

	function forceRefreshConsumers() {
		console.log("[Debug] Force refreshing consumers...");
		consumerTrackMap.clear();
		Object.values(consumerVideos).forEach((video) => {
			if (video) video.srcObject = null;
		});
		updateConsumerVideos(consumers, consumerVideos);
	}

	function bindVideoElement(element: HTMLVideoElement, consumerKey: string) {
		if (element) {
			consumerVideos[consumerKey] = element;
			console.log("[Debug] Video element bound for:", consumerKey);

			// Force a reactive update by calling the update function
			updateConsumerVideos(consumers, consumerVideos);

			// Return cleanup function
			return {
				destroy() {
					if (consumerVideos[consumerKey]) {
						consumerVideos[consumerKey].srcObject = null;
						delete consumerVideos[consumerKey];
						consumerTrackMap.delete(consumerKey);
					}
				},
			};
		}
	}
</script>

<div class="debug-container" in:blur={{ delay: 500, duration: 1000 }}>
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
								use:bindVideoElement={getConsumerKey(consumer)}
								autoplay
								playsinline
								muted
								controls={false}
								class="video-preview"
								class:is-paused={consumer.paused}
								on:loadeddata={() => {
									const key = getConsumerKey(consumer);
									console.log("[Debug] Video loadeddata for:", key);
									// Force update when video is ready
									setTimeout(() => updateConsumerVideos(consumers, consumerVideos), 100);
								}}
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
											await mediaClient.resumeConsumer(consumer);
										} else {
											await mediaClient.pauseConsumer(consumer);
										}
									}}
								>
									{consumer.paused ? "Resume" : "Pause"}
								</button>
								<button
									class="button is-small is-danger"
									on:click={() => mediaClient.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag)}
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
												await mediaClient.resumeConsumer(consumer);
											} else {
												await mediaClient.pauseConsumer(consumer);
											}
										}}
									>
										{consumer.paused ? "Resume" : "Pause"}
									</button>
									<button
										class="button is-small is-danger"
										on:click={() => mediaClient.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag)}
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
					<label class="label is-small">Update Peer Name</label>
					<div class="field is-grouped">
						<div class="control">
							<div class="select is-small">
								<select bind:value={targetPeerId}>
									<option value="">Select Peer...</option>
									{#each peersList as peer (peer.peerId)}
										<option value={peer.peerId}>{peer.peerId} ({peer.name || "Unnamed"})</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="control is-expanded">
							<input class="input is-small" type="text" placeholder="New name" bind:value={peerNameInput} />
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

		<!-- Debug Controls -->
		<div class="field">
			<label class="label is-small">Debug Controls:</label>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={forceRefreshConsumers}>Force Refresh Video Streams</button>
				<button class="button is-info" on:click={() => console.log("Consumers:", consumers, "Videos:", consumerVideos)}>Log State</button>
			</div>
		</div>

		<!-- Room Controls -->
		<div class="field">
			<label class="label is-small">Room Connection:</label>
		</div>

		<!-- Media Stream Controls -->
		<div class="field">
			<span class="label is-small">Media Stream Controls</span>
			<div class="buttons are-small">
				<button class="button is-info" on:click={() => mediaClient.startLocalMediaStream(false, true)} disabled={hasLocalCam}>Video Only</button>
				<button class="button is-info" on:click={() => mediaClient.startLocalMediaStream(true, false)} disabled={hasLocalCam}>Audio Only</button>
				<button class="button is-info" on:click={() => mediaClient.startLocalMediaStream(true, true)} disabled={hasLocalCam}>Audio + Video</button>
				<button class="button is-success" on:click={mediaClient.sendMediaStreams} disabled={!hasLocalCam || !joined}>Send Streams</button>
				<button class="button is-danger" on:click={mediaClient.closeMediaStreams} disabled={!hasSendTransport}>Stop Sending</button>
			</div>
		</div>

		<!-- Producer Controls -->
		<div class="field">
			<span class="label is-small">Producer Controls</span>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={() => mediaClient.toggleVideoPaused()} disabled={!hasCamVideo}>
					{camVideoPaused ? "Resume Video Producer" : "Pause Video Producer"}
				</button>
				<button class="button is-warning" on:click={() => mediaClient.toggleAudioPaused()} disabled={!hasCamAudio}>
					{camAudioPaused ? "Resume Audio Producer" : "Pause Audio Producer"}
				</button>
			</div>
		</div>

		<!-- Consumer Controls -->
		<div class="field">
			<span class="label is-small">Consumer Controls</span>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={mediaClient.resumeAllConsumers} disabled={consumers.length === 0}>Resume All Consumers</button>
				<button class="button is-warning" on:click={mediaClient.pauseAllConsumers} disabled={consumers.length === 0}>Pause All Consumers</button>
				<button class="button is-danger" on:click={mediaClient.closeAllConsumers} disabled={consumers.length === 0}>Close All Consumers</button>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.debug-container {
		height: 100vh;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1rem;
		box-sizing: border-box;
		-webkit-overflow-scrolling: touch; // Smooth scrolling on iOS

		@media screen and (max-width: 768px) {
			padding: 0.75rem;
		}

		@media screen and (max-width: 480px) {
			padding: 0.5rem;
		}
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

		@media screen and (max-width: 768px) {
			min-height: 100px;
			max-height: 150px;
		}
	}

	.card.is-active-speaker {
		border: 2px solid var(--bulma-primary);
	}

	.box {
		padding: 1rem;
		margin-bottom: 1rem;

		@media screen and (max-width: 768px) {
			padding: 0.75rem;
			margin-bottom: 0.75rem;
		}

		@media screen and (max-width: 480px) {
			padding: 0.5rem;
			margin-bottom: 0.5rem;
		}
	}

	.subtitle {
		margin-bottom: 0.75rem !important;

		@media screen and (max-width: 768px) {
			font-size: 1.1rem !important;
		}
	}

	.field {
		margin-bottom: 1rem;

		@media screen and (max-width: 768px) {
			margin-bottom: 0.75rem;
		}
	}

	.label {
		margin-bottom: 0.25rem !important;
	}

	// Mobile-specific improvements
	@media screen and (max-width: 768px) {
		.title {
			font-size: 1.5rem !important;
			margin-bottom: 1rem !important;
		}

		.buttons {
			flex-wrap: wrap;
			gap: 0.25rem;
		}

		.button.is-small {
			font-size: 0.7rem;
			padding: 0.25rem 0.5rem;
		}

		.tags .tag {
			font-size: 0.6rem;
		}

		.column {
			padding: 0.5rem;
		}
	}

	@media screen and (max-width: 480px) {
		.columns {
			margin: 0 !important;
		}

		.column {
			padding: 0.25rem;
		}

		.field.is-grouped {
			flex-direction: column;

			.control {
				width: 100%;
				margin-bottom: 0.5rem;
			}
		}
	}
</style>
