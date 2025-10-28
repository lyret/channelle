<script lang="ts">
	import { blur } from "svelte/transition";
	import * as roomClient from "~/api/room/roomClient";
	import { wsPeerIdStore } from "~/api/_trpcClient";
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
		sessionsStore,
		hasJoinedRoomStore,
		isBannedFromTheRoom,
		hasLocalCamStore,
		hasSendTransportStore,
		hasRecvTransportStore,
	} from "~/api/room/roomClient";

	import SessionStats from "./SessionStats.svelte";
	import PeerMediaStatus from "./PeerMediaStatus.svelte";
	import ConnectionStatus from "./ConnectionStatus.svelte";
	import VideoConnectionDebug from "./VideoConnectionDebug.svelte";

	// Local state for UI
	let newPasswordInput = "";
	let peerNameInput = "";
	let targetPeerId = "";
	let activeDebugTab = "overview"; // overview, video-debug, consumers, etc.

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
	$: sessions = $sessionsStore;
	$: peersList = Object.entries(peers).map(([peerId, info]) => ({
		peerId,
		...info,
		hasTransport: $recvTransports[peerId] !== undefined,
		session: sessions[peerId],
	}));

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

	function getConsumerKey(consumer: any): string {
		return `${consumer.appData.peerId}-${consumer.appData.mediaTag}`;
	}

	function isVideoConsumer(consumer: any): boolean {
		return consumer.appData.mediaTag.includes("video");
	}

	function srcObject(node: any, stream: any) {
		if (!stream) return undefined;
		node.srcObject = stream;
		return {
			update(newStream: any) {
				if (node.srcObject != newStream) {
					node.srcObject = newStream;
				}
			},
		};
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

<div class="debug-view" in:blur={{ delay: 500, duration: 1000 }}>
	<div class="container is-fluid">
		<h1 class="title">🔍 Debug Dashboard</h1>

		<!-- Tab Navigation -->
		<div class="tabs is-boxed">
			<ul>
				<li class:is-active={activeDebugTab === "overview"}>
					<a on:click={() => (activeDebugTab = "overview")}>
						<span class="icon is-small"><i class="fas fa-chart-line"></i></span>
						<span>Overview</span>
					</a>
				</li>
				<li class:is-active={activeDebugTab === "video-debug"}>
					<a on:click={() => (activeDebugTab = "video-debug")}>
						<span class="icon is-small"><i class="fas fa-video"></i></span>
						<span>Video Debug</span>
					</a>
				</li>
				<li class:is-active={activeDebugTab === "consumers"}>
					<a on:click={() => (activeDebugTab = "consumers")}>
						<span class="icon is-small"><i class="fas fa-play-circle"></i></span>
						<span>Consumers</span>
					</a>
				</li>
			</ul>
		</div>

		{#if activeDebugTab === "overview"}
			<!-- Session Statistics Overview -->
			<SessionStats />

			<!-- My Connection Status -->
			<div class="box">
				<h2 class="subtitle">My Connection</h2>
				<div class="columns is-multiline">
					<div class="column is-6">
						<table class="table is-fullwidth is-narrow">
							<tbody>
								<tr>
									<td><strong>Peer ID:</strong></td>
									<td>{myPeerId}</td>
								</tr>
								<tr>
									<td><strong>Status:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={joined} class:is-danger={!joined}>
											{joined ? "Joined" : "Not Joined"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Banned:</strong></td>
									<td>
										<span class="tag is-small" class:is-danger={banned} class:is-success={!banned}>
											{banned ? "Yes" : "No"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Device:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={device}>
											{device ? "Supported" : "Not Supported"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Camera:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={hasLocalCam}>
											{hasLocalCam ? "Available" : "Not Available"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Send Transport:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={hasSendTransport}>
											{hasSendTransport ? "Connected" : "Disconnected"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Recv Transport:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={hasRecvTransport}>
											{hasRecvTransport ? "Connected" : "Disconnected"}
										</span>
									</td>
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
											{#if peer.actor}
												<span class="tag is-success">Actor</span>
											{/if}
											{#if peer.manager}
												<span class="tag is-info">Manager</span>
											{/if}
											{#if !peer.actor && !peer.manager}
												<span class="tag">Visitor</span>
											{/if}
										</div>
									</td>
								</tr>
								<tr>
									<td><strong>My Name:</strong></td>
									<td>{peer?.name || "Unknown"}</td>
								</tr>
								<tr>
									<td><strong>Transport Count:</strong></td>
									<td>{recvTransportCount}</td>
								</tr>
								<tr>
									<td><strong>Producers:</strong></td>
									<td>
										<span class="tag is-small is-success">{hasCamVideo ? "1" : "0"} Video</span>
										<span class="tag is-small is-warning">{hasCamAudio ? "1" : "0"} Audio</span>
									</td>
								</tr>
								<tr>
									<td><strong>Consumers:</strong></td>
									<td>
										<span class="tag is-small is-info">{consumers.filter((c) => c.appData.mediaTag?.includes("video")).length} Video</span>
										<span class="tag is-small is-info">{consumers.filter((c) => c.appData.mediaTag?.includes("audio")).length} Audio</span>
									</td>
								</tr>
								<tr>
									<td><strong>Active Speaker:</strong></td>
									<td>{activeSpeaker}</td>
								</tr>
								<tr>
									<td><strong>Media Status:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={hasCamVideo && !camVideoPaused} class:is-warning={camVideoPaused}>
											📹 {hasCamVideo ? (camVideoPaused ? "Paused" : "Active") : "Off"}
										</span>
										<span class="tag is-small" class:is-success={hasCamAudio && !camAudioPaused} class:is-warning={camAudioPaused}>
											🎤 {hasCamAudio ? (camAudioPaused ? "Paused" : "Active") : "Off"}
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Stage Settings -->
			<div class="box">
				<h2 class="subtitle">Stage Settings</h2>
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
									<td>
										<span class="tag is-small" class:is-warning={stageCurtains} class:is-success={!stageCurtains}>
											{stageCurtains ? "Closed" : "Open"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Chat:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={stageChatEnabled} class:is-danger={!stageChatEnabled}>
											{stageChatEnabled ? "Enabled" : "Disabled"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Effects:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={stageEffectsEnabled} class:is-danger={!stageEffectsEnabled}>
											{stageEffectsEnabled ? "Enabled" : "Disabled"}
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="column is-6">
						<table class="table is-fullwidth is-narrow">
							<tbody>
								<tr>
									<td><strong>Visitor Audio:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={stageVisitorAudioEnabled} class:is-danger={!stageVisitorAudioEnabled}>
											{stageVisitorAudioEnabled ? "Enabled" : "Disabled"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Visitor Video:</strong></td>
									<td>
										<span class="tag is-small" class:is-success={stageVisitorVideoEnabled} class:is-danger={!stageVisitorVideoEnabled}>
											{stageVisitorVideoEnabled ? "Enabled" : "Disabled"}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Layout:</strong></td>
									<td>{stageLayout || "Default"}</td>
								</tr>
								<tr>
									<td><strong>Scene:</strong></td>
									<td>{stagePredefinedLayout || "None"}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- Stage Password Setting -->
				<div class="field">
					<label class="label is-small">Change Stage Password:</label>
					<div class="field has-addons">
						<div class="control is-expanded">
							<input class="input is-small" type="text" placeholder="New password (empty to remove)" bind:value={newPasswordInput} />
						</div>
						<div class="control">
							<button class="button is-small is-primary" on:click={setStagePassword}>Update</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Video Previews -->
			<div class="box">
				<h2 class="subtitle">Media Streams</h2>
				<div class="columns is-multiline">
					<!-- Local Camera -->
					{#if hasLocalCam}
						<div class="column is-4-desktop is-6-tablet">
							<div class="card">
								<div class="card-content p-2">
									<p class="subtitle is-6 mb-1">My Camera</p>
									<video bind:this={localCamVideo} autoplay playsinline muted class="video-preview" class:is-paused={camVideoPaused} />
									<div class="tags are-small mt-1">
										<span class="tag" class:is-success={hasCamVideo && !camVideoPaused} class:is-warning={camVideoPaused}>
											📹 {hasCamVideo ? (camVideoPaused ? "Paused" : "Active") : "Off"}
										</span>
										<span class="tag" class:is-success={hasCamAudio && !camAudioPaused} class:is-warning={camAudioPaused}>
											🎤 {hasCamAudio ? (camAudioPaused ? "Paused" : "Active") : "Off"}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Consumer Videos -->
					{#each consumers.filter(isVideoConsumer) as consumer (getConsumerKey(consumer))}
						<div class="column is-4-desktop is-6-tablet">
							<div class="card" class:is-active-speaker={consumer.appData.peerId === activeSpeaker}>
								<div class="card-content p-2">
									<p class="subtitle is-6 mb-1">{peers[consumer.appData.peerId]?.name || consumer.appData.peerId}</p>
									<p class="is-size-7 has-text-grey">{consumer.appData.mediaTag}</p>
									<video
										bind:this={consumerVideos[getConsumerKey(consumer)]}
										use:srcObject={consumer.track ? new MediaStream([consumer.track]) : null}
										autoplay
										playsinline
										muted
										class="video-preview"
										class:is-paused={consumer.paused}
									></video>
									<div class="tags are-small mt-1">
										<span class="tag" class:is-success={!consumer.paused} class:is-warning={consumer.paused}>
											📹 {consumer.paused ? "Paused" : "Active"}
										</span>
										{#if consumer.appData.peerId === activeSpeaker}
											<span class="tag is-primary">🗣️ Speaking</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Peer List with Debug Info -->
			<div class="box">
				<h2 class="subtitle">Peer Details</h2>
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
								<PeerMediaStatus
									peerId={peer.peerId}
									peerData={peer}
									sessionData={peer.session}
									isActiveSpeaker={peer.peerId === activeSpeaker}
								/>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Management Tools -->
			<div class="box">
				<h2 class="subtitle">Management Tools</h2>
				<div class="columns">
					<div class="column is-6">
						<div class="field">
							<label class="label is-small">Update Peer Name:</label>
							<div class="field is-grouped">
								<div class="control">
									<div class="select is-small">
										<select bind:value={targetPeerId}>
											<option value="">Select peer...</option>
											{#each peersList as peer (peer.peerId)}
												<option value={peer.peerId}>{peer.name || peer.peerId}</option>
											{/each}
										</select>
									</div>
								</div>
								<div class="control is-expanded">
									<input class="input is-small" type="text" placeholder="New name" bind:value={peerNameInput} />
								</div>
								<div class="control">
									<button class="button is-small is-primary" on:click={updatePeerName} disabled={!targetPeerId || !peerNameInput.trim()}>
										Update
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Connection Controls -->
			<div class="box">
				<h2 class="subtitle">Connection Controls</h2>

				<div class="field">
					<label class="label is-small">Room Connection:</label>
					<div class="buttons are-small">
						<button class="button is-primary" on:click={roomClient.joinRoom} disabled={joined}>Join Room</button>
						<button class="button is-danger" on:click={roomClient.leaveRoom} disabled={!joined}>Leave Room</button>
					</div>
				</div>

				<div class="field">
					<label class="label is-small">Local Media:</label>
					<div class="buttons are-small">
						<button class="button is-info" on:click={() => roomClient.startLocalMediaStream(false, true)} disabled={hasLocalCam}>Start Video</button
						>
						<button class="button is-info" on:click={() => roomClient.startLocalMediaStream(true, false)} disabled={hasLocalCam}>Start Audio</button
						>
						<button class="button is-info" on:click={() => roomClient.startLocalMediaStream(true, true)} disabled={hasLocalCam}>Start Both</button>
						<button class="button is-success" on:click={roomClient.sendMediaStreams} disabled={!hasLocalCam || !joined}>Send Streams</button>
						<button class="button is-danger" on:click={roomClient.closeMediaStreams} disabled={!hasSendTransport}>Close Streams</button>
					</div>
				</div>

				<div class="field">
					<label class="label is-small">Media Control:</label>
					<div class="buttons are-small">
						<button class="button is-warning" on:click={() => roomClient.toggleVideoPaused()} disabled={!hasCamVideo}>
							{camVideoPaused ? "Resume" : "Pause"} Video
						</button>
						<button class="button is-warning" on:click={() => roomClient.toggleAudioPaused()} disabled={!hasCamAudio}>
							{camAudioPaused ? "Resume" : "Pause"} Audio
						</button>
					</div>
				</div>

				<div class="field">
					<label class="label is-small">Consumer Control:</label>
					<div class="buttons are-small">
						<button class="button is-warning" on:click={roomClient.resumeAllConsumers} disabled={consumers.length === 0}>Resume All</button>
						<button class="button is-warning" on:click={roomClient.pauseAllConsumers} disabled={consumers.length === 0}>Pause All</button>
						<button class="button is-danger" on:click={roomClient.closeAllConsumers} disabled={consumers.length === 0}>Close All</button>
					</div>
				</div>
			</div>
		{:else if activeDebugTab === "video-debug"}
			<VideoConnectionDebug />
		{:else if activeDebugTab === "consumers"}
			<div class="box">
				<h1 class="title is-4 has-text-white">Consumer Details</h1>
				<div class="columns is-multiline">
					{#each consumers.filter(isVideoConsumer) as consumer (getConsumerKey(consumer))}
						<div class="column is-4-desktop is-6-tablet">
							<div class="card" class:is-active-speaker={consumer.appData.peerId === activeSpeaker}>
								<div class="card-content p-2">
									<video
										bind:this={consumerVideos[getConsumerKey(consumer)]}
										use:srcObject={consumer.track ? new MediaStream([consumer.track]) : null}
										autoplay
										playsinline
										muted
										class="video-preview"
										class:is-paused={consumer.paused}
									></video>
									<div class="consumer-info">
										<p class="subtitle is-6 has-text-white mb-1">
											{peers[consumer.appData.peerId]?.name || consumer.appData.peerId}
										</p>
										<div class="tags are-small">
											<span class="tag is-info">{consumer.appData.mediaTag}</span>
											<span class="tag" class:is-success={!consumer.paused} class:is-danger={consumer.paused}>
												{consumer.paused ? "Paused" : "Playing"}
											</span>
											<span
												class="tag"
												class:is-success={consumer.track?.readyState === "live"}
												class:is-warning={consumer.track?.readyState === "muted"}
												class:is-danger={consumer.track?.readyState === "ended"}
											>
												{consumer.track?.readyState || "No Track"}
											</span>
										</div>
										<p class="is-size-7 has-text-grey-light">
											ID: {consumer.id.slice(-8)}<br />
											Track: {consumer.track?.id?.slice(-8) || "None"}
										</p>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.debug-view {
		min-height: 100vh;
		background: #f5f5f5;
		padding: 1rem;
	}

	.container {
		max-width: none;
	}

	.video-preview {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border-radius: 4px;
		background: #000;

		&.is-paused {
			filter: grayscale(100%) brightness(0.5);
		}
	}

	.card.is-active-speaker {
		border: 2px solid #3273dc;
	}

	.box {
		margin-bottom: 2rem;
	}

	.subtitle {
		margin-bottom: 1rem;
		color: #363636;
	}

	.field {
		margin-bottom: 1.5rem;
	}

	.label {
		font-weight: 600;
		color: #363636;
	}

	.table td {
		vertical-align: middle;
	}
</style>
