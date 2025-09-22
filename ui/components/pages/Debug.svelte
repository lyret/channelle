<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { blur } from "svelte/transition";
	import * as Debug from "~/api/room";

	// Import all the stores
	import {
		joinedStore,
		localMediaStream,
		paused,
		sendTransport,
		recvTransports,
		videoProducer,
		audioProducer,
		currentActiveSpeakerStore,
		consumersStore,
		myPeerIdStore,
		hasLocalCamStore,
		hasSendTransportStore,
		hasRecvTransportStore,
		peersStore,
		camPausedStore,
		micPausedStore,
	} from "~/api/room";

	// Local state for UI
	let peerIdInput = "";
	let mediaTagInput = "";
	let showConfig = false;

	// Video element refs
	let localCamVideo: HTMLVideoElement;
	let consumerVideos: { [key: string]: HTMLVideoElement } = {};

	// Subscribe to stores using $ prefix
	$: myPeerId = $myPeerIdStore;
	$: joined = $joinedStore;
	$: hasLocalCam = $hasLocalCamStore;
	$: hasSendTransport = $hasSendTransportStore;
	$: hasRecvTransport = $hasRecvTransportStore;
	$: recvTransportCount = Object.keys($recvTransports).length;
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
		hasAudio: info.media && (info.media["mic-audio"] || info.media["screen-audio"]),
		mediaTags: info.media ? Object.keys(info.media) : [],
		hasTransport: $recvTransports[id] !== undefined,
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

	// Use the paused stores directly
	$: camVideoPaused = $camPausedStore;
	$: camAudioPaused = $micPausedStore;

	onMount(() => {
		Debug.joinRoom();
	});

	onDestroy(() => {
		Debug.leaveRoom();
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
</script>

<div class="container is-fluid" in:blur={{ delay: 500, duration: 1000 }}>
	<h1 class="title">Debug Interface</h1>

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
									on:click={async () => {
										if (consumer.paused) {
											await Debug.resumeConsumer(consumer);
										} else {
											await Debug.pauseConsumer(consumer);
										}
									}}
								>
									{consumer.paused ? "Resume" : "Pause"}
								</button>
								<button
									class="button is-small is-danger"
									on:click={() => Debug.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag)}
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
										on:click={async () => {
											if (consumer.paused) {
												await Debug.resumeConsumer(consumer);
											} else {
												await Debug.pauseConsumer(consumer);
											}
										}}
									>
										{consumer.paused ? "Resume" : "Pause"}
									</button>
									<button
										class="button is-small is-danger"
										on:click={() => Debug.unsubscribeFromTrack(consumer.appData.peerId, consumer.appData.mediaTag)}
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
							<td><strong>Receive Transports:</strong></td>
							<td>
								<span class="tag is-small" class:is-success={hasRecvTransport}>
									{recvTransportCount}
									{recvTransportCount === 1 ? "transport" : "transports"}
								</span>
							</td>
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
							<th>Transport</th>
							<th>Media</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each peersList as peer}
							<tr key={peer.id}>
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
									<span class="tag is-small" class:is-success={peer.hasTransport} class:is-light={!peer.hasTransport}>
										{peer.hasTransport ? "Connected" : "No Transport"}
									</span>
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
														on:click={() => Debug.subscribeToTrack(peer.id, "cam-video")}
														disabled={!joined || peer.id === myPeerId}
													>
														Subscribe Cam
													</button>
												{:else}
													<button class="button is-small is-danger" on:click={() => Debug.unsubscribeFromTrack(peer.id, "cam-video")}>
														Unsubscribe Cam
													</button>
												{/if}
											{/if}
										{/if}
										{#if peer.hasAudio}
											{#if peer.media["mic-audio"]}
												{#if !consumers.find((c) => c.appData.peerId === peer.id && c.appData.mediaTag === "mic-audio")}
													<button
														class="button is-small is-success"
														on:click={() => Debug.subscribeToTrack(peer.id, "mic-audio")}
														disabled={!joined || peer.id === myPeerId}
													>
														Subscribe Audio
													</button>
												{:else}
													<button class="button is-small is-danger" on:click={() => Debug.unsubscribeFromTrack(peer.id, "mic-audio")}>
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
				<button class="button is-primary" on:click={Debug.joinRoom} disabled={joined}> Join Room </button>
				<button class="button is-danger" on:click={Debug.leaveRoom} disabled={!joined}> Leave Room </button>
			</div>
		</div>

		<!-- Media Stream Controls -->
		<div class="field">
			<label class="label is-small">Media Stream Controls</label>
			<div class="buttons are-small">
				<button class="button is-info" on:click={() => Debug.startLocalMediaStream(false, true)} disabled={hasLocalCam}> Video Only </button>
				<button class="button is-info" on:click={() => Debug.startLocalMediaStream(true, false)} disabled={hasLocalCam}> Audio Only </button>
				<button class="button is-info" on:click={() => Debug.startLocalMediaStream(true, true)} disabled={hasLocalCam}> Audio + Video </button>
				<button class="button is-success" on:click={() => Debug.sendMediaStreams()} disabled={!hasLocalCam || !joined}> Send Streams </button>
				<button class="button is-danger" on:click={() => Debug.closeMediaStreams()} disabled={!hasSendTransport}> Stop Sending </button>
			</div>
		</div>

		<!-- Producer Controls -->
		<div class="field">
			<label class="label is-small">Producer Controls</label>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={() => Debug.toggleVideoPaused()} disabled={!hasCamVideo}>
					{camVideoPaused ? "Resume Video" : "Pause Video"}
				</button>
				<button class="button is-warning" on:click={() => Debug.toggleAudioPaused()} disabled={!hasCamAudio}>
					{camAudioPaused ? "Unmute Mic" : "Mute Mic"}
				</button>
			</div>
		</div>

		<!-- Consumer Controls -->
		<div class="field">
			<label class="label is-small">Consumer Controls</label>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={() => Debug.resumeAllConsumers()} disabled={consumers.length === 0}> Resume All </button>
				<button class="button is-warning" on:click={() => Debug.pauseAllConsumers()} disabled={consumers.length === 0}> Pause All </button>
				<button class="button is-danger" on:click={() => Debug.closeAllConsumers()} disabled={consumers.length === 0}> Close All </button>
			</div>
		</div>

		<!-- Manual Track Subscription -->
		<div class="field">
			<label class="label is-small">Manual Track Subscription</label>
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
						on:click={() => Debug.subscribeToTrack(peerIdInput, mediaTagInput)}
						disabled={!peerIdInput || !mediaTagInput || !joined}
					>
						Subscribe
					</button>
				</p>
				<p class="control">
					<button
						class="button is-small is-danger"
						on:click={() => Debug.unsubscribeFromTrack(peerIdInput, mediaTagInput)}
						disabled={!peerIdInput || !mediaTagInput || !joined}
					>
						Unsubscribe
					</button>
				</p>
			</div>
		</div>

		<!-- Track Statistics -->
		<div class="field">
			<label class="label is-small">Track Statistics</label>
			<button
				class="button is-small is-info"
				on:click={() => {
					const stats = Debug.getTrackStats();
					console.log("Track Statistics:", stats);
				}}
			>
				Log Track Stats
			</button>
		</div>
	</div>

	<!-- CONFIG Section -->
	<div class="box">
		<h2 class="subtitle">
			Configuration
			<button class="button is-small is-pulled-right" on:click={() => (showConfig = !showConfig)}>
				{showConfig ? "Hide" : "Show"} CONFIG
			</button>
		</h2>

		{#if showConfig}
			<div class="json-container">
				<pre class="json-output"><code>{JSON.stringify(CONFIG, null, 2)}</code></pre>
			</div>
		{/if}
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

	.json-container {
		border-radius: 8px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 3px;
		margin-top: 1rem;
	}

	.json-output {
		background: #1e1e1e;
		color: #d4d4d4;
		border-radius: 6px;
		padding: 1.5rem;
		margin: 0;
		overflow-x: auto;
		font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
		font-size: 0.85rem;
		line-height: 1.6;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.json-output code {
		color: #9cdcfe;
		background: transparent;
		padding: 0;
	}
</style>
