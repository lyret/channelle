<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { blur } from "svelte/transition";
	import * as Debug from "./room/debugfunctions";

	// Import all the stores
	import {
		joinedStore,
		localMediaStream,
		sendTransport,
		recvTransportStore,
		videoProducer,
		audioProducer,
		currentActiveSpeakerStore,
		consumersStore,
		myPeerIdStore,
		hasLocalCamStore,
		hasSendTransportStore,
		hasRecvTransportStore,
		peersStore,
	} from "./room/debugfunctions";

	// Local state for UI
	let peerIdInput = "";
	let mediaTagInput = "";
	let statusMessage = "";
	let error = "";

	// Video element refs
	let localCamVideo: HTMLVideoElement;
	let consumerVideos: { [key: string]: HTMLVideoElement } = {};

	// Subscribe to stores using $ prefix
	$: myPeerId = $myPeerIdStore;
	$: joined = $joinedStore;
	$: hasLocalCam = $hasLocalCamStore;
	$: hasSendTransport = $hasSendTransportStore;
	$: hasRecvTransport = $hasRecvTransportStore;
	$: hasCamVideo = !!$videoProducer;
	$: hasCamAudio = !!$audioProducer;
	$: activeSpeaker = $currentActiveSpeakerStore?.peerId || "None";
	$: consumers = $consumersStore;
	$: consumerCount = consumers.length;
	$: consumerStats = {
		total: consumers.length,
		active: consumers.filter((c) => !c.paused).length,
		paused: consumers.filter((c) => c.paused).length,
		video: consumers.filter((c) => c.appData.mediaTag?.includes("video")).length,
		audio: consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length,
	};
	$: peers = $peersStore;
	$: peersList = Object.entries(peers).map(([id, info]: [string, any]) => ({
		id,
		...info,
		hasVideo: info.media && (info.media["cam-video"] || info.media["screen-video"]),
		hasAudio: info.media && (info.media["cam-audio"] || info.media["screen-audio"]),
		mediaTags: info.media ? Object.keys(info.media) : [],
	}));

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
			const videoElement = consumerVideos[key];
			if (videoElement && consumer.track && consumer.track.kind === "video") {
				const stream = new MediaStream([consumer.track]);
				videoElement.srcObject = stream;
				videoElement.play().catch((e) => console.error("Error playing consumer video:", e));
			}
		});
	}

	// Computed properties for producer states
	$: camVideoPaused = $videoProducer?.paused || false;
	$: camAudioPaused = $audioProducer?.paused || false;

	onMount(() => {
		Debug.joinRoom();
	});

	onDestroy(() => {
		// Clean up video elements
		if (localCamVideo) {
			localCamVideo.srcObject = null;
		}
		Object.values(consumerVideos).forEach((video) => {
			if (video) {
				video.srcObject = null;
			}
		});
	});

	async function handleAction(fn: () => Promise<void>, successMsg: string) {
		try {
			error = "";
			statusMessage = "Processing...";
			await fn();
			statusMessage = successMsg;
			setTimeout(() => {
				statusMessage = "";
			}, 3000);
		} catch (e: any) {
			error = `Error: ${e.message || e}`;
			statusMessage = "";
			setTimeout(() => {
				error = "";
			}, 5000);
		}
	}

	async function handleToggle(fn: (paused?: boolean) => Promise<void>, currentState: boolean, type: string) {
		await handleAction(() => fn(!currentState), `${type} ${!currentState ? "paused" : "resumed"}`);
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
</script>

<div class="container is-fluid" in:blur={{ delay: 500, duration: 1000 }}>
	<h1 class="title">Debug Interface</h1>

	{#if statusMessage}
		<div class="notification is-success is-light">
			{statusMessage}
		</div>
	{/if}

	{#if error}
		<div class="notification is-danger is-light">
			{error}
		</div>
	{/if}

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
									Video: {hasCamVideo ? (camVideoPaused ? "Paused" : "Active") : "Inactive"}
								</span>
								<span class="tag" class:is-success={hasCamAudio && !camAudioPaused} class:is-warning={camAudioPaused}>
									Audio: {hasCamAudio ? (camAudioPaused ? "Paused" : "Active") : "Inactive"}
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
								class="video-preview"
								class:is-paused={consumer.paused}
							/>
							<div class="tags are-small mt-1">
								<span class="tag" class:is-success={!consumer.paused} class:is-warning={consumer.paused}>
									{consumer.paused ? "Paused" : "Active"}
								</span>
								{#if consumer.appData.peerId === activeSpeaker}
									<span class="tag is-primary">Speaking</span>
								{/if}
							</div>
							<div class="buttons are-small mt-1">
								<button
									class="button is-small is-warning"
									on:click={() =>
										handleAction(
											async () => (consumer.paused ? await Debug.resumeConsumer(consumer) : await Debug.pauseConsumer(consumer)),
											`Consumer ${consumer.paused ? "resumed" : "paused"}`,
										)}
								>
									{consumer.paused ? "Resume" : "Pause"}
								</button>
								<button
									class="button is-small is-danger"
									on:click={() =>
										handleAction(
											() => Debug.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag),
											`Unsubscribed from ${consumer.appData.mediaTag}`,
										)}
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
					{#each consumers.filter(isAudioConsumer) as consumer}
						<div class="column is-6">
							<div class="box p-2">
								<div class="level is-mobile mb-1">
									<div class="level-left">
										<span class="tag is-small" class:is-primary={consumer.appData.peerId === activeSpeaker}>
											{consumer.appData.peerId} - {consumer.appData.mediaTag}
											{#if consumer.appData.peerId === activeSpeaker}
												🔊{/if}
										</span>
									</div>
									<div class="level-right">
										<span class="tag is-small" class:is-success={!consumer.paused} class:is-warning={consumer.paused}>
											{consumer.paused ? "Paused" : "Active"}
										</span>
									</div>
								</div>
								<div class="buttons are-small">
									<button
										class="button is-small is-warning"
										on:click={() =>
											handleAction(
												async () => (consumer.paused ? await Debug.resumeConsumer(consumer) : await Debug.pauseConsumer(consumer)),
												`Audio ${consumer.paused ? "resumed" : "paused"}`,
											)}
									>
										{consumer.paused ? "Resume" : "Pause"}
									</button>
									<button
										class="button is-small is-danger"
										on:click={() =>
											handleAction(
												() => Debug.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag),
												`Unsubscribed from audio`,
											)}
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

	<!-- Status Section -->
	<div class="columns is-multiline">
		<div class="column is-6">
			<div class="box">
				<h2 class="subtitle">Status</h2>
				<table class="table is-fullwidth is-narrow">
					<tbody>
						<tr>
							<td><strong>My Peer ID:</strong></td>
							<td>{myPeerId || "Not connected"}</td>
						</tr>
						<tr>
							<td><strong>Joined:</strong></td>
							<td><span class="tag is-small" class:is-success={joined}>{joined ? "Yes" : "No"}</span></td>
						</tr>
						<tr>
							<td><strong>Local Camera:</strong></td>
							<td><span class="tag is-small" class:is-success={hasLocalCam}>{hasLocalCam ? "Active" : "Inactive"}</span></td>
						</tr>
						<tr>
							<td><strong>Send Transport:</strong></td>
							<td><span class="tag is-small" class:is-success={hasSendTransport}>{hasSendTransport ? "Active" : "Inactive"}</span></td>
						</tr>
						<tr>
							<td><strong>Receive Transport:</strong></td>
							<td><span class="tag is-small" class:is-success={hasRecvTransport}>{hasRecvTransport ? "Active" : "Inactive"}</span></td>
						</tr>
						<tr>
							<td><strong>Active Speaker:</strong></td>
							<td>{activeSpeaker}</td>
						</tr>
						<tr>
							<td><strong>Total Consumers:</strong></td>
							<td>{consumerStats.total}</td>
						</tr>
						<tr>
							<td><strong>Active/Paused:</strong></td>
							<td>
								<span class="tag is-small is-success">{consumerStats.active}</span>
								/
								<span class="tag is-small is-warning">{consumerStats.paused}</span>
							</td>
						</tr>
						<tr>
							<td><strong>Video/Audio:</strong></td>
							<td>
								<span class="tag is-small is-info">{consumerStats.video}</span>
								/
								<span class="tag is-small is-info">{consumerStats.audio}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div class="column is-6">
			<div class="box">
				<h2 class="subtitle">Producers</h2>
				<table class="table is-fullwidth is-narrow">
					<tbody>
						<tr>
							<td><strong>Camera Video:</strong></td>
							<td>
								<span class="tag is-small" class:is-success={hasCamVideo && !camVideoPaused} class:is-warning={camVideoPaused}>
									{hasCamVideo ? (camVideoPaused ? "Paused" : "Active") : "Inactive"}
								</span>
							</td>
						</tr>
						<tr>
							<td><strong>Camera Audio:</strong></td>
							<td>
								<span class="tag is-small" class:is-success={hasCamAudio && !camAudioPaused} class:is-warning={camAudioPaused}>
									{hasCamAudio ? (camAudioPaused ? "Paused" : "Active") : "Inactive"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Peers Section -->
	<div class="box">
		<h2 class="subtitle">Connected Peers</h2>

		<!-- Peer Statistics -->
		<div class="level is-mobile mb-3">
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">Total Peers</p>
					<p class="title is-5">{peersList.length}</p>
				</div>
			</div>
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">With Video</p>
					<p class="title is-5">{peersList.filter((p) => p.hasVideo).length}</p>
				</div>
			</div>
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">With Audio</p>
					<p class="title is-5">{peersList.filter((p) => p.hasAudio).length}</p>
				</div>
			</div>
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">Subscribed</p>
					<p class="title is-5">{new Set(consumers.map((c) => c.appData.peerId)).size}</p>
				</div>
			</div>
		</div>

		{#if peersList.length > 0}
			<div class="table-container">
				<table class="table is-fullwidth is-narrow is-hoverable">
					<thead>
						<tr>
							<th>Peer ID</th>
							<th>Media</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each peersList as peer}
							<tr>
								<td>
									<span class="has-text-weight-semibold">{peer.id}</span>
									{#if peer.id === myPeerId}
										<span class="tag is-small is-primary ml-2">You</span>
									{/if}
									{#if peer.id === activeSpeaker}
										<span class="tag is-small is-success ml-2">Speaking</span>
									{/if}
								</td>
								<td>
									<div class="tags are-small">
										{#each peer.mediaTags as tag}
											<span class="tag" class:is-info={tag.includes("video")} class:is-warning={tag.includes("audio")}>
												{tag}
											</span>
										{/each}
										{#if peer.mediaTags.length === 0}
											<span class="tag">No media</span>
										{/if}
									</div>
								</td>
								<td>
									<div class="buttons are-small">
										{#if peer.hasVideo}
											{#if peer.media["cam-video"]}
												{#if !consumers.find((c) => c.appData.peerId === peer.id && c.appData.mediaTag === "cam-video")}
													<button
														class="button is-small is-success"
														on:click={() =>
															handleAction(() => Debug.subscribeToTrack(peer.id, "cam-video"), "Subscribed to camera video")}
														disabled={!joined || peer.id === myPeerId}
													>
														Subscribe Cam
													</button>
												{:else}
													<button
														class="button is-small is-danger"
														on:click={() =>
															handleAction(
																() => Debug.unsubscribeFromTrack(peer.id, "cam-video"),
																"Unsubscribed from camera video",
															)}
													>
														Unsubscribe Cam
													</button>
												{/if}
											{/if}
										{/if}
										{#if peer.hasAudio}
											{#if peer.media["cam-audio"]}
												{#if !consumers.find((c) => c.appData.peerId === peer.id && c.appData.mediaTag === "cam-audio")}
													<button
														class="button is-small is-success"
														on:click={() => handleAction(() => Debug.subscribeToTrack(peer.id, "cam-audio"), "Subscribed to audio")}
														disabled={!joined || peer.id === myPeerId}
													>
														Subscribe Audio
													</button>
												{:else}
													<button
														class="button is-small is-danger"
														on:click={() =>
															handleAction(() => Debug.unsubscribeFromTrack(peer.id, "cam-audio"), "Unsubscribed from audio")}
													>
														Unsubscribe Audio
													</button>
												{/if}
											{/if}
										{/if}
										{#if peer.id === myPeerId || (!peer.hasVideo && !peer.hasAudio)}
											<button class="button is-small" disabled>No actions</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="has-text-grey">No peers connected</p>
		{/if}
	</div>

	<!-- Controls Section -->
	<div class="box">
		<h2 class="subtitle">Controls</h2>

		<!-- Room Controls -->
		<div class="field">
			<label class="label is-small">Room Controls</label>
			<div class="buttons are-small">
				<button class="button is-primary" on:click={() => handleAction(Debug.joinRoom, "Joined room")} disabled={joined}> Join Room </button>
				<button class="button is-danger" on:click={() => handleAction(Debug.leaveRoom, "Left room")} disabled={!joined}> Leave Room </button>
			</div>
		</div>

		<!-- Camera Controls -->
		<div class="field">
			<label class="label is-small">Camera Controls</label>
			<div class="buttons are-small">
				<button
					class="button is-info"
					on:click={() => handleAction(() => Debug.startLocalMediaStream(false, true), "Camera started")}
					disabled={hasLocalCam}
				>
					Start Camera
				</button>
				<button class="button is-info" on:click={() => handleAction(Debug.sendVideoStream, "Video stream sent")} disabled={!hasLocalCam || !joined}>
					Send Video
				</button>
				<button
					class="button is-info"
					on:click={() => handleAction(() => Debug.startLocalMediaStream(true, true), "Camera + Mic started")}
					disabled={hasLocalCam}
				>
					Start Both
				</button>
				<button class="button is-info" on:click={() => handleAction(Debug.sendMediaStreams, "All streams sent")} disabled={!hasLocalCam || !joined}>
					Send Both
				</button>
				<button class="button is-warning" on:click={() => handleAction(Debug.cycleCamera, "Camera cycled")} disabled={!hasCamVideo}>
					Cycle Camera
				</button>
				<button class="button is-danger" on:click={() => handleAction(Debug.stopStreams, "Streams stopped")} disabled={!hasSendTransport}>
					Stop All
				</button>
			</div>
		</div>

		<!-- Audio Controls -->
		<div class="field">
			<label class="label is-small">Audio Controls</label>
			<div class="buttons are-small">
				<button
					class="button is-info"
					on:click={() => handleAction(() => Debug.startLocalMediaStream(true, false), "Microphone started")}
					disabled={hasLocalCam}
				>
					Start Microphone
				</button>
				<button class="button is-info" on:click={() => handleAction(Debug.sendAudioStream, "Audio stream sent")} disabled={!hasLocalCam || !joined}>
					Send Audio
				</button>
				<button
					class="button is-warning"
					on:click={() => handleToggle(Debug.changeMicPaused, Debug.getMicPausedState(), "Microphone")}
					disabled={!hasCamAudio}
				>
					{Debug.getMicPausedState() ? "Unmute" : "Mute"} Mic
				</button>
			</div>
		</div>

		<!-- Video Pause/Resume Controls -->
		<div class="field">
			<label class="label is-small">Video Controls</label>
			<div class="buttons are-small">
				<button
					class="button is-warning"
					on:click={() => handleToggle(Debug.changeCamPaused, Debug.getCamPausedState(), "Camera")}
					disabled={!hasCamVideo}
				>
					{Debug.getCamPausedState() ? "Show Video" : "Hide Video"}
				</button>
			</div>
		</div>

		<!-- Track Subscription -->
		<div class="field">
			<label class="label is-small">Track Subscription</label>
			<div class="field is-grouped">
				<p class="control">
					<input class="input is-small" type="text" placeholder="Peer ID" bind:value={peerIdInput} />
				</p>
				<p class="control">
					<input class="input is-small" type="text" placeholder="Media Tag (e.g., cam-video)" bind:value={mediaTagInput} />
				</p>
				<p class="control">
					<button
						class="button is-small is-success"
						on:click={() =>
							handleAction(() => Debug.subscribeToTrack(peerIdInput, mediaTagInput), `Subscribed to ${mediaTagInput} from ${peerIdInput}`)}
						disabled={!peerIdInput || !mediaTagInput || !joined}
					>
						Subscribe
					</button>
				</p>
				<p class="control">
					<button
						class="button is-small is-danger"
						on:click={() =>
							handleAction(
								() => Debug.unsubscribeFromTrack(peerIdInput, mediaTagInput),
								`Unsubscribed from ${mediaTagInput} from ${peerIdInput}`,
							)}
						disabled={!peerIdInput || !mediaTagInput || !joined}
					>
						Unsubscribe
					</button>
				</p>
			</div>
		</div>

		<!-- Consumer Controls -->
		<div class="field">
			<label class="label is-small">Consumer Controls</label>
			<div class="buttons are-small">
				<button
					class="button is-small is-warning"
					on:click={() =>
						handleAction(async () => {
							for (const consumer of consumers) {
								if (consumer.paused) {
									await Debug.resumeConsumer(consumer);
								}
							}
						}, "All consumers resumed")}
					disabled={consumers.length === 0}
				>
					Resume All
				</button>
				<button
					class="button is-small is-warning"
					on:click={() =>
						handleAction(async () => {
							for (const consumer of consumers) {
								if (!consumer.paused) {
									await Debug.pauseConsumer(consumer);
								}
							}
						}, "All consumers paused")}
					disabled={consumers.length === 0}
				>
					Pause All
				</button>
				<button
					class="button is-small is-danger"
					on:click={() =>
						handleAction(async () => {
							const consumersToClose = [...consumers];
							for (const consumer of consumersToClose) {
								await Debug.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag);
							}
						}, "All consumers closed")}
					disabled={consumers.length === 0}
				>
					Close All
				</button>
			</div>
		</div>

		<!-- Device Info -->
		<div class="field">
			<label class="label is-small">Device Info</label>
			<button
				class="button is-small is-info"
				on:click={async () => {
					const deviceId = await Debug.getCurrentDeviceId();
					statusMessage = deviceId ? `Current device ID: ${deviceId}` : "No device ID available";
				}}
			>
				Get Current Device ID
			</button>
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

	.table td {
		padding: 0.25em 0.5em;
	}
</style>
