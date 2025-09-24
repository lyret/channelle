<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { blur } from "svelte/transition";
	import * as roomClient from "~/api/room/roomClient";
	import { wsPeerIdStore } from "~/api/_trpcClient";

	// Import all the stores from roomClient
	import {
		deviceStore,
		stagePasswordStore,
		stageLayoutStore,
		sceneStore,
		stageCurtainsStore,
		stageChatEnabledStore,
		stageEffectsEnabledStore,
		stageHaveVisitorAudioEnabledStore,
		stageHaveVisitorVideoEnabledStore,
		camPausedStore,
		micPausedStore,
		localMediaStream,
		recvTransports,
		videoProducer,
		audioProducer,
		currentActiveSpeakerStore,
		consumersStore,
		peersStore,
		peerStore,
		hasJoinedRoomStore,
		isBannedFromTheRoom,
		hasLocalCamStore,
		hasSendTransportStore,
		hasRecvTransportStore,
	} from "~/api/room/roomClient";

	// Local state for UI
	let peerIdInput = "";
	let mediaTagInput = "";

	let newPasswordInput = "";
	let peerNameInput = "";
	let targetPeerId = "";

	// Video element refs
	let localCamVideo: HTMLVideoElement;
	const consumerVideos: { [key: string]: HTMLVideoElement } = {};

	// Reactive statements for all stores
	$: myPeerId = $wsPeerIdStore;
	$: device = $deviceStore;
	$: joined = $hasJoinedRoomStore;
	$: banned = $isBannedFromTheRoom;
	$: peer = $peerStore;
	$: hasLocalCam = $hasLocalCamStore;
	$: hasSendTransport = $hasSendTransportStore;
	$: hasRecvTransport = $hasRecvTransportStore;
	$: recvTransportCount = Object.keys($recvTransports).length;
	$: hasCamVideo = !!$videoProducer;
	$: hasCamAudio = !!$audioProducer;
	$: activeSpeaker = $currentActiveSpeakerStore?.peerId || "None";
	$: consumers = $consumersStore;
	$: peers = $peersStore;
	$: peersList = Object.entries(peers).map(([peerId, info]) => ({
		peerId,
		...info,
		hasTransport: $recvTransports[peerId] !== undefined,
	}));

	$: peerCount = peersList.length;
	$: onlinePeerCount = peersList.filter((p) => p.online).length;

	// Stage-related reactive statements
	$: stagePassword = $stagePasswordStore;
	$: stageLayout = $stageLayoutStore;
	$: stagePredefinedLayout = $sceneStore;
	$: stageCurtains = $stageCurtainsStore;
	$: stageChatEnabled = $stageChatEnabledStore;
	$: stageEffectsEnabled = $stageEffectsEnabledStore;
	$: stageVisitorAudioEnabled = $stageHaveVisitorAudioEnabledStore;
	$: stageVisitorVideoEnabled = $stageHaveVisitorVideoEnabledStore;

	// Paused states
	$: camVideoPaused = $camPausedStore;
	$: camAudioPaused = $micPausedStore;

	// Consumer statistics
	$: consumerStats = {
		total: consumers.length,
		active: consumers.filter((c) => !c.paused).length,
		paused: consumers.filter((c) => c.paused).length,
		video: consumers.filter((c) => c.appData.mediaTag?.includes("video")).length,
		audio: consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length,
	};

	// Update video elements when streams change
	$: if (localCamVideo && $localMediaStream) {
		localCamVideo.srcObject = $localMediaStream;
		localCamVideo.play().catch((e) => console.error("Error playing local camera:", e));
	} else if (localCamVideo && !$localMediaStream) {
		localCamVideo.srcObject = null;
	}

	// Update consumer videos when consumers change
	$: {
		console.log("[Debug] Updating consumer videos, total consumers:", consumers.length);
		consumers.forEach((consumer) => {
			const key = `${consumer.appData.peerId}-${consumer.appData.mediaTag}`;
			console.log("[Debug] Processing consumer:", {
				key,
				hasTrack: !!consumer.track,
				trackKind: consumer.track?.kind,
				trackState: consumer.track?.readyState,
				paused: consumer.paused,
			});

			if (consumer.track && consumer.track.kind === "video") {
				const videoElement = consumerVideos[key];
				console.log("[Debug] Video element found for key:", key, !!videoElement);

				if (videoElement) {
					try {
						const stream = new MediaStream([consumer.track]);
						videoElement.srcObject = stream;
						console.log("[Debug] Set video source for:", key);
						// Force play attempt
						videoElement.play().catch((e) => {
							console.warn("[Debug] Video play failed for", key, e);
						});
					} catch (e) {
						console.error("[Debug] Error setting video source for", key, e);
					}
				} else {
					console.warn("[Debug] No video element found for key:", key);
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

	async function subscribeToTrack() {
		if (peerIdInput && mediaTagInput) {
			await roomClient.subscribeToTrack(peerIdInput, mediaTagInput as any);
		}
	}

	async function unsubscribeFromTrack() {
		if (peerIdInput && mediaTagInput) {
			await roomClient.unsubscribeFromTrack(peerIdInput, mediaTagInput as any);
		}
	}
</script>

<div class="container is-fluid" in:blur={{ delay: 500, duration: 1000 }}>
	<h1 class="title">Debug Interface</h1>

	<!-- Status Overview -->
	<div class="box">
		<h2 class="subtitle">Connection Status</h2>
		<div class="columns is-multiline">
			<div class="column is-6">
				<table class="table is-fullwidth is-narrow">
					<tbody>
						<tr>
							<td><strong>My Peer ID:</strong></td>
							<td>{myPeerId || "Not connected"}</td>
						</tr>
						<tr>
							<td><strong>Room Joined:</strong></td>
							<td><span class="tag is-small" class:is-success={joined} class:is-danger={!joined}>{joined ? "Yes" : "No"}</span></td>
						</tr>
						<tr>
							<td><strong>Account Banned:</strong></td>
							<td><span class="tag is-small" class:is-danger={banned} class:is-success={!banned}>{banned ? "Yes" : "No"}</span></td>
						</tr>
						<tr>
							<td><strong>MediaSoup Device:</strong></td>
							<td><span class="tag is-small" class:is-success={device}>{device ? "Loaded" : "Not loaded"}</span></td>
						</tr>
						<tr>
							<td><strong>Local Media Stream:</strong></td>
							<td><span class="tag is-small" class:is-success={hasLocalCam}>{hasLocalCam ? "Available" : "Not Available"}</span></td>
						</tr>
						<tr>
							<td><strong>Outgoing Transport:</strong></td>
							<td><span class="tag is-small" class:is-success={hasSendTransport}>{hasSendTransport ? "Connected" : "Not Connected"}</span></td>
						</tr>
						<tr>
							<td><strong>Incoming Transports:</strong></td>
							<td><span class="tag is-small" class:is-success={hasRecvTransport}>{recvTransportCount} Connected</span></td>
						</tr>
						<tr>
							<td><strong>Active Speaker:</strong></td>
							<td>{activeSpeaker}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="column is-6">
				<table class="table is-fullwidth is-narrow">
					<tbody>
						<tr>
							<td><strong>My Role:</strong></td>
							<td>
								<div class="tags are-small">
									{#if peer.actor}<span class="tag is-success">Actor</span>{/if}
									{#if peer.manager}<span class="tag is-info">Manager</span>{/if}
									{#if !peer.actor && !peer.manager}<span class="tag">Visitor</span>{/if}
								</div>
							</td>
						</tr>
						<tr>
							<td><strong>My Name:</strong></td>
							<td>{peer.name || "Unnamed"}</td>
						</tr>
						<tr>
							<td><strong>Total Consumers:</strong></td>
							<td>{consumerStats.total}</td>
						</tr>
						<tr>
							<td><strong>Consumer Status:</strong></td>
							<td>
								<span class="tag is-small is-success">{consumerStats.active} Active</span>
								/
								<span class="tag is-small is-warning">{consumerStats.paused} Paused</span>
							</td>
						</tr>
						<tr>
							<td><strong>Consumer Types:</strong></td>
							<td>
								<span class="tag is-small is-info">{consumerStats.video} Video</span>
								/
								<span class="tag is-small is-info">{consumerStats.audio} Audio</span>
							</td>
						</tr>
						<tr>
							<td><strong>My Producers:</strong></td>
							<td>
								<span class="tag is-small" class:is-success={hasCamVideo && !camVideoPaused} class:is-warning={camVideoPaused}>
									Video Producer: {hasCamVideo ? (camVideoPaused ? "Paused" : "Sending") : "Not Sending"}
								</span>
								<span class="tag is-small" class:is-success={hasCamAudio && !camAudioPaused} class:is-warning={camAudioPaused}>
									Audio Producer: {hasCamAudio ? (camAudioPaused ? "Paused" : "Sending") : "Not Sending"}
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Stage Configuration -->
	<div class="box">
		<h2 class="subtitle">Stage Configuration</h2>
		<div class="columns">
			<div class="column is-6">
				<table class="table is-fullwidth is-narrow">
					<tbody>
						<tr>
							<td><strong>Password:</strong></td>
							<td>{stagePassword || "None"}</td>
						</tr>
						<tr>
							<td><strong>Curtains:</strong></td>
							<td
								><span class="tag is-small" class:is-warning={stageCurtains} class:is-success={!stageCurtains}
									>{stageCurtains ? "Closed" : "Open"}</span
								></td
							>
						</tr>
						<tr>
							<td><strong>Chat:</strong></td>
							<td
								><span class="tag is-small" class:is-success={stageChatEnabled} class:is-danger={!stageChatEnabled}
									>{stageChatEnabled ? "Enabled" : "Disabled"}</span
								></td
							>
						</tr>
						<tr>
							<td><strong>Effects:</strong></td>
							<td
								><span class="tag is-small" class:is-success={stageEffectsEnabled} class:is-danger={!stageEffectsEnabled}
									>{stageEffectsEnabled ? "Enabled" : "Disabled"}</span
								></td
							>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="column is-6">
				<table class="table is-fullwidth is-narrow">
					<tbody>
						<tr>
							<td><strong>Visitor Audio:</strong></td>
							<td
								><span class="tag is-small" class:is-success={stageVisitorAudioEnabled} class:is-danger={!stageVisitorAudioEnabled}
									>{stageVisitorAudioEnabled ? "Allowed" : "Blocked"}</span
								></td
							>
						</tr>
						<tr>
							<td><strong>Visitor Video:</strong></td>
							<td
								><span class="tag is-small" class:is-success={stageVisitorVideoEnabled} class:is-danger={!stageVisitorVideoEnabled}
									>{stageVisitorVideoEnabled ? "Allowed" : "Blocked"}</span
								></td
							>
						</tr>
						<tr>
							<td><strong>Layout:</strong></td>
							<td>{stagePredefinedLayout || "Custom"}</td>
						</tr>
						<tr>
							<td><strong>Layout Items:</strong></td>
							<td>{stageLayout.length} items</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Password Management -->
		<div class="field">
			<label class="label is-small">Set Stage Password</label>
			<div class="field has-addons">
				<div class="control is-expanded">
					<input class="input is-small" type="text" placeholder="New password (empty to remove)" bind:value={newPasswordInput} />
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
	<div class="box">
		<h2 class="subtitle">Connected Peers</h2>

		<!-- Peer Statistics -->
		<div class="level is-mobile mb-3">
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">Total Peers</p>
					<p class="title is-5">{peerCount}</p>
				</div>
			</div>
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">Online Peers</p>
					<p class="title is-5">{onlinePeerCount}</p>
				</div>
			</div>
			<div class="level-item has-text-centered">
				<div>
					<p class="heading">Actors</p>
					<p class="title is-5">{peersList.filter((p) => p.actor).length}</p>
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
							<th>Name</th>
							<th>Role</th>
							<th>Transport</th>
							<th>Media</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each peersList as peer (peer.peerId)}
							<tr>
								<td>
									<span class="has-text-weight-semibold">{peer.peerId}</span>
									{#if peer.peerId === myPeerId}
										<span class="tag is-small is-primary ml-2">You</span>
									{/if}
									{#if peer.peerId === activeSpeaker}
										<span class="tag is-small is-success ml-2">Speaking</span>
									{/if}
								</td>
								<td>{peer.name || "Unnamed"}</td>
								<td>
									<div class="tags are-small">
										{#if peer.actor}<span class="tag is-success">Actor</span>{/if}
										{#if peer.manager}<span class="tag is-info">Manager</span>{/if}
										{#if peer.banned}<span class="tag is-danger">Banned</span>{/if}
										{#if !peer.actor && !peer.manager}<span class="tag">Visitor</span>{/if}
									</div>
								</td>
								<td>
									<span class="tag is-small" class:is-success={peer.hasTransport} class:is-danger={!peer.hasTransport}>
										Transport: {peer.hasTransport ? "Connected" : "Not Connected"}
									</span>
								</td>
								<td>
									<div class="tags are-small">
										<span class="tag">Media Info Available via Sessions</span>
									</div>
								</td>
								<td>
									<div class="buttons are-small">
										{#if !consumers.find((c) => c.appData.peerId === peer.peerId && c.appData.mediaTag === "cam-video")}
											<button
												class="button is-small is-success"
												on:click={() => roomClient.subscribeToTrack(peer.peerId, "cam-video")}
												disabled={!joined || peer.peerId === myPeerId}
											>
												Subscribe to Video
											</button>
										{:else}
											<button
												class="button is-small is-danger"
												on:click={() => roomClient.unsubscribeFromTrack(peer.peerId, "cam-video")}
											>
												Unsubscribe Video
											</button>
										{/if}
										{#if !consumers.find((c) => c.appData.peerId === peer.peerId && c.appData.mediaTag === "mic-audio")}
											<button
												class="button is-small is-success"
												on:click={() => roomClient.subscribeToTrack(peer.peerId, "mic-audio")}
												disabled={!joined || peer.peerId === myPeerId}
											>
												Subscribe to Audio
											</button>
										{:else}
											<button
												class="button is-small is-danger"
												on:click={() => roomClient.unsubscribeFromTrack(peer.peerId, "mic-audio")}
											>
												Unsubscribe Audio
											</button>
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
			<div class="column is-6">
				<div class="field">
					<label class="label is-small">Peer Actions</label>
					<div class="buttons are-small">
						{#each peersList.filter((p) => p.peerId !== myPeerId) as peer (peer.peerId)}
							<div class="dropdown is-hoverable">
								<div class="dropdown-trigger">
									<button class="button is-small" aria-haspopup="true">
										{peer.peerId} <span class="icon is-small"><i class="fas fa-angle-down" aria-hidden="true"></i></span>
									</button>
								</div>
								<div class="dropdown-menu">
									<div class="dropdown-content">
										<button
											class="dropdown-item button is-white"
											on:click={() => roomClient.updatePeerBannedStatus(peer.peerId, !peer.banned)}
										>
											{peer.banned ? "Unban" : "Ban"} Peer
										</button>
										<button
											class="dropdown-item button is-white"
											on:click={() => roomClient.updatePeerActorStatus(peer.peerId, !peer.actor)}
										>
											{peer.actor ? "Remove Actor" : "Make Actor"}
										</button>
										<button
											class="dropdown-item button is-white"
											on:click={() => roomClient.updatePeerManagerStatus(peer.peerId, !peer.manager)}
										>
											{peer.manager ? "Remove Manager" : "Make Manager"}
										</button>
									</div>
								</div>
							</div>
						{/each}
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
			<label class="label is-small">Room Controls</label>
			<div class="buttons are-small">
				<button class="button is-primary" on:click={roomClient.joinRoom} disabled={joined}>Join Room</button>
				<button class="button is-danger" on:click={roomClient.leaveRoom} disabled={!joined}>Leave Room</button>
			</div>
		</div>

		<!-- Media Stream Controls -->
		<div class="field">
			<label class="label is-small">Media Stream Controls</label>
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
			<label class="label is-small">Producer Controls</label>
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
			<label class="label is-small">Consumer Controls</label>
			<div class="buttons are-small">
				<button class="button is-warning" on:click={roomClient.resumeAllConsumers} disabled={consumers.length === 0}>Resume All Consumers</button>
				<button class="button is-warning" on:click={roomClient.pauseAllConsumers} disabled={consumers.length === 0}>Pause All Consumers</button>
				<button class="button is-danger" on:click={roomClient.closeAllConsumers} disabled={consumers.length === 0}>Close All Consumers</button>
			</div>
		</div>

		<!-- Manual Track Subscription -->
		<div class="field">
			<label class="label is-small">Manual Track Subscription</label>
			<div class="field is-grouped">
				<div class="control">
					<input class="input is-small" type="text" placeholder="Peer ID" bind:value={peerIdInput} />
				</div>
				<div class="control">
					<input class="input is-small" type="text" placeholder="Media Tag (e.g., cam-video)" bind:value={mediaTagInput} />
				</div>
				<div class="control">
					<button class="button is-small is-success" on:click={subscribeToTrack} disabled={!peerIdInput || !mediaTagInput || !joined}>
						Subscribe to Track
					</button>
				</div>
				<div class="control">
					<button class="button is-small is-danger" on:click={unsubscribeFromTrack} disabled={!peerIdInput || !mediaTagInput || !joined}>
						Unsubscribe from Track
					</button>
				</div>
			</div>
		</div>

		<!-- Track Statistics -->
		<div class="field">
			<label class="label is-small">Track Statistics</label>
			<button
				class="button is-small is-info"
				on:click={() => {
					const stats = roomClient.getTrackStats();
					console.log("Track Statistics:", stats);
				}}
			>
				Log Track Stats
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

	.dropdown {
		margin-right: 0.5rem;
	}
</style>
