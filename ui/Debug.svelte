<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { blur } from "svelte/transition";
	import * as Debug from "./room/debugfunctions";

	// Import all the stores
	import {
		joinedStore,
		localCamStore,
		localScreenStore,
		sendTransportStore,
		recvTransportStore,
		camVideoProducerStore,
		camAudioProducerStore,
		screenVideoProducerStore,
		screenAudioProducerStore,
		currentActiveSpeakerStore,
		consumersStore,
		myPeerIdStore,
		hasLocalCamStore,
		hasLocalScreenStore,
		hasSendTransportStore,
		hasRecvTransportStore,
	} from "./room/debugfunctions";

	// Local state for UI
	let peerIdInput = "";
	let mediaTagInput = "";
	let statusMessage = "";
	let error = "";

	// Video element refs
	let localCamVideo: HTMLVideoElement;
	let localScreenVideo: HTMLVideoElement;
	let consumerVideos: { [key: string]: HTMLVideoElement } = {};

	// Subscribe to stores using $ prefix
	$: myPeerId = $myPeerIdStore;
	$: joined = $joinedStore;
	$: hasLocalCam = $hasLocalCamStore;
	$: hasLocalScreen = $hasLocalScreenStore;
	$: hasSendTransport = $hasSendTransportStore;
	$: hasRecvTransport = $hasRecvTransportStore;
	$: hasCamVideo = !!$camVideoProducerStore;
	$: hasCamAudio = !!$camAudioProducerStore;
	$: hasScreenVideo = !!$screenVideoProducerStore;
	$: hasScreenAudio = !!$screenAudioProducerStore;
	$: activeSpeaker = $currentActiveSpeakerStore?.peerId || "None";
	$: consumers = $consumersStore;
	$: consumerCount = consumers.length;

	// Update video elements when streams change
	$: if (localCamVideo && $localCamStore) {
		localCamVideo.srcObject = $localCamStore;
		localCamVideo.play().catch((e) => console.error("Error playing local camera:", e));
	} else if (localCamVideo && !$localCamStore) {
		localCamVideo.srcObject = null;
	}

	$: if (localScreenVideo && $localScreenStore) {
		localScreenVideo.srcObject = $localScreenStore;
		localScreenVideo.play().catch((e) => console.error("Error playing local screen:", e));
	} else if (localScreenVideo && !$localScreenStore) {
		localScreenVideo.srcObject = null;
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
	$: camVideoPaused = $camVideoProducerStore?.paused || false;
	$: camAudioPaused = $camAudioProducerStore?.paused || false;
	$: screenVideoPaused = $screenVideoProducerStore?.paused || false;
	$: screenAudioPaused = $screenAudioProducerStore?.paused || false;

	onMount(() => {
		Debug.onPageLoad();
	});

	onDestroy(() => {
		// Clean up video elements
		if (localCamVideo) {
			localCamVideo.srcObject = null;
		}
		if (localScreenVideo) {
			localScreenVideo.srcObject = null;
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

			<!-- Local Screen Share -->
			{#if hasLocalScreen}
				<div class="column is-4-desktop is-6-tablet">
					<div class="card">
						<div class="card-content p-2">
							<p class="subtitle is-6 mb-1">Screen Share</p>
							<video bind:this={localScreenVideo} autoplay playsinline muted class="video-preview" class:is-paused={screenVideoPaused} />
							<div class="tags are-small mt-1">
								<span class="tag" class:is-success={hasScreenVideo && !screenVideoPaused} class:is-warning={screenVideoPaused}>
									Video: {hasScreenVideo ? (screenVideoPaused ? "Paused" : "Active") : "Inactive"}
								</span>
								<span class="tag" class:is-success={hasScreenAudio && !screenAudioPaused} class:is-warning={screenAudioPaused}>
									Audio: {hasScreenAudio ? (screenAudioPaused ? "Paused" : "Active") : "Inactive"}
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
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Audio-only consumers -->
		{#if consumers.filter(isAudioConsumer).length > 0}
			<div class="content">
				<p class="subtitle is-6">Audio Consumers</p>
				<div class="tags">
					{#each consumers.filter(isAudioConsumer) as consumer}
						<span class="tag" class:is-primary={consumer.appData.peerId === activeSpeaker}>
							{consumer.appData.peerId} - {consumer.appData.mediaTag}: {consumer.paused ? "Paused" : "Active"}
							{#if consumer.appData.peerId === activeSpeaker}
								🔊
							{/if}
						</span>
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
							<td><strong>Screen Share:</strong></td>
							<td><span class="tag is-small" class:is-success={hasLocalScreen}>{hasLocalScreen ? "Active" : "Inactive"}</span></td>
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
							<td><strong>Consumers:</strong></td>
							<td>{consumerCount}</td>
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
						<tr>
							<td><strong>Screen Video:</strong></td>
							<td>
								<span class="tag is-small" class:is-success={hasScreenVideo && !screenVideoPaused} class:is-warning={screenVideoPaused}>
									{hasScreenVideo ? (screenVideoPaused ? "Paused" : "Active") : "Inactive"}
								</span>
							</td>
						</tr>
						<tr>
							<td><strong>Screen Audio:</strong></td>
							<td>
								<span class="tag is-small" class:is-success={hasScreenAudio && !screenAudioPaused} class:is-warning={screenAudioPaused}>
									{hasScreenAudio ? (screenAudioPaused ? "Paused" : "Active") : "Inactive"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
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

		<!-- Media Controls -->
		<div class="field">
			<label class="label is-small">Media Controls</label>
			<div class="buttons are-small">
				<button class="button is-info" on:click={() => handleAction(Debug.startCamera, "Camera started")} disabled={hasLocalCam}> Start Camera </button>
				<button class="button is-info" on:click={() => handleAction(Debug.sendCameraStreams, "Camera streams sent")} disabled={!hasLocalCam || !joined}>
					Send Camera
				</button>
				<button
					class="button is-info"
					on:click={() => handleAction(Debug.startScreenshare, "Screen share started")}
					disabled={!joined || hasLocalScreen}
				>
					Screen Share
				</button>
				<button class="button is-warning" on:click={() => handleAction(Debug.cycleCamera, "Camera cycled")} disabled={!hasCamVideo}>
					Cycle Camera
				</button>
				<button class="button is-danger" on:click={() => handleAction(Debug.stopStreams, "Streams stopped")} disabled={!hasSendTransport}>
					Stop Streams
				</button>
			</div>
		</div>

		<!-- Pause/Resume Controls -->
		<div class="field">
			<label class="label is-small">Pause/Resume Controls</label>
			<div class="buttons are-small">
				<button
					class="button is-warning"
					on:click={() => handleToggle(Debug.changeCamPaused, Debug.getCamPausedState(), "Camera")}
					disabled={!hasCamVideo}
				>
					{Debug.getCamPausedState() ? "Resume" : "Pause"} Camera
				</button>
				<button
					class="button is-warning"
					on:click={() => handleToggle(Debug.changeMicPaused, Debug.getMicPausedState(), "Microphone")}
					disabled={!hasCamAudio}
				>
					{Debug.getMicPausedState() ? "Resume" : "Pause"} Mic
				</button>
				<button
					class="button is-warning"
					on:click={() => handleToggle(Debug.changeScreenPaused, Debug.getScreenPausedState(), "Screen")}
					disabled={!hasScreenVideo}
				>
					{Debug.getScreenPausedState() ? "Resume" : "Pause"} Screen
				</button>
				<button
					class="button is-warning"
					on:click={() => handleToggle(Debug.changeScreenAudioPaused, Debug.getScreenAudioPausedState(), "Screen Audio")}
					disabled={!hasScreenAudio}
				>
					{Debug.getScreenAudioPausedState() ? "Resume" : "Pause"} Screen Audio
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
