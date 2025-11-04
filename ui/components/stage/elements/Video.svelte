<script lang="ts">
	import { peersStore, consumersStore, sessionsStore, subscribeToTrack } from "~/api/media";
	import { localMediaStream } from "~/api/media";
	import { wsPeerIdStore } from "~/api/_trpcClient";
	import { DebugPanel } from "~/components/debug";
	import { debugModeStore } from "~/stores/debugMode";

	export let peerId: string;

	// Component state
	let videoElement: HTMLVideoElement;
	let lastStreamId: string | null = null;
	let reconnectionAttempts = 0;
	let lastConsumerCount = 0;
	const debugInfo = {
		lastUpdate: Date.now(),
		streamChanges: 0,
		consumerChanges: 0,
		subscriptionAttempts: 0,
		videoElementUpdates: 0,
	};

	$: peer = $peersStore[peerId];
	$: session = $sessionsStore[peerId];
	$: myPeerId = $wsPeerIdStore;
	$: isLocalPeer = peerId === myPeerId;

	// Make stream reactive to all dependencies
	$: stream = findStream(peerId, isLocalPeer, $localMediaStream, $consumersStore);

	// Enhanced reactive debugging to track changes
	$: {
		const now = Date.now();
		const timeSinceLastUpdate = now - debugInfo.lastUpdate;
		debugInfo.lastUpdate = now;

		console.log(`[Video] REACTIVE UPDATE for ${peerId} (${timeSinceLastUpdate}ms since last):`, {
			isLocalPeer,
			hasLocalMediaStream: !!$localMediaStream,
			localMediaTracks: $localMediaStream?.getTracks().length || 0,
			totalConsumers: $consumersStore.length,
			myConsumers: $consumersStore.filter((c) => c.appData.peerId === peerId),
			hasStream: !!stream,
			streamTracks: stream?.getTracks().length || 0,
			streamHasVideo,
			streamHasAudio,
			streamId: stream?.id || null,
			lastStreamId,
			debugInfo,
			peerOnline: peer?.online,
			sessionExists: !!session,
			hasVideoAvailable,
			hasVideoConsumer: !!hasVideoConsumer,
		});

		// Track stream changes
		if (stream?.id !== lastStreamId) {
			debugInfo.streamChanges++;
			lastStreamId = stream?.id || null;
			console.log(`[Video] Stream changed for ${peerId}: ${lastStreamId} (change #${debugInfo.streamChanges})`);
		}
	}

	// Enhanced consumer monitoring
	$: {
		const relevantConsumers = $consumersStore.filter((c) => c.appData.peerId === peerId);

		if (relevantConsumers.length !== lastConsumerCount) {
			debugInfo.consumerChanges++;
			lastConsumerCount = relevantConsumers.length;
			console.log(`[Video] Consumer count changed for ${peerId}: ${lastConsumerCount} (change #${debugInfo.consumerChanges})`);
		}

		console.log(
			`[Video] Consumer details for ${peerId}:`,
			relevantConsumers.map((consumer, index) => ({
				index,
				id: consumer.id,
				mediaTag: consumer.appData.mediaTag,
				hasTrack: !!consumer.track,
				paused: consumer.paused,
				trackState: consumer.track?.readyState,
				trackId: consumer.track?.id,
				connectionState: consumer.rtpReceiver?.transport?.state,
			})),
		);
	}

	// Enhanced local media stream monitoring
	$: {
		if (isLocalPeer) {
			console.log(`[Video] Local media stream details for ${peerId}:`, {
				hasStream: !!$localMediaStream,
				streamId: $localMediaStream?.id,
				tracks: $localMediaStream?.getTracks().length || 0,
				videoTracks: $localMediaStream?.getVideoTracks().map((t) => ({ id: t.id, state: t.readyState, enabled: t.enabled })) || [],
				audioTracks: $localMediaStream?.getAudioTracks().map((t) => ({ id: t.id, state: t.readyState, enabled: t.enabled })) || [],
			});
		}
	}

	// Check if peer has video available and we don't have a consumer for it
	$: hasVideoAvailable = session && session.media && session.media["cam-video"];
	$: hasVideoConsumer = $consumersStore.find(
		(consumer) => consumer.appData.peerId === peerId && consumer.appData.mediaTag === "cam-video" && !consumer.closed,
	);

	// Enhanced auto-subscribe logic with retry mechanism
	$: {
		const shouldSubscribe = hasVideoAvailable && !hasVideoConsumer && !isLocalPeer && peer?.online;

		console.log(`[Video] Auto-subscription check for ${peerId}:`, {
			hasVideoAvailable,
			hasVideoConsumer: !!hasVideoConsumer,
			isLocalPeer,
			peerOnline: peer?.online,
			shouldSubscribe,
			reconnectionAttempts,
			debugInfo,
		});

		if (shouldSubscribe) {
			const currentAttempts = debugInfo.subscriptionAttempts + 1;
			debugInfo.subscriptionAttempts = currentAttempts;
			console.log(`[Video] Auto-subscribing to video track for peer ${peerId} (attempt #${currentAttempts})`);

			subscribeToTrack(peerId, "cam-video")
				.then(() => {
					console.log(`[Video] Successfully subscribed to video track for peer ${peerId}`);
					reconnectionAttempts = 0; // Reset on success
				})
				.catch((error) => {
					console.error(`[Video] Failed to subscribe to video track for peer ${peerId}:`, error);
					reconnectionAttempts++;

					// Retry mechanism with exponential backoff
					if (reconnectionAttempts < 3) {
						const delay = Math.pow(2, reconnectionAttempts) * 1000;
						console.log(`[Video] Will retry subscription for ${peerId} in ${delay}ms`);
						// No reactive update needed - reconnectionAttempts change will trigger re-evaluation
					}
				});
		}
	}

	// Enhanced stream finding with better error handling
	function findStream(peerId: string, isLocalPeer: boolean, localMediaStream: MediaStream | null, consumers: any[]): MediaStream | undefined {
		try {
			// If this is the local peer, use the local media stream
			if (isLocalPeer) {
				if (localMediaStream && localMediaStream.getTracks().length > 0) {
					console.log(
						`[Video] Using local media stream for ${peerId}, tracks:`,
						localMediaStream.getTracks().map((t) => ({ id: t.id, kind: t.kind, state: t.readyState })),
					);
					return localMediaStream;
				} else {
					console.log(`[Video] Local peer ${peerId} but no valid local media stream:`, {
						hasStream: !!localMediaStream,
						trackCount: localMediaStream?.getTracks().length || 0,
					});
					return undefined;
				}
			}

			// For remote peers, find the consumer
			const consumer = consumers.find((consumer) => consumer.appData.peerId === peerId && consumer.appData.mediaTag === "cam-video" && !consumer.closed);

			if (consumer && consumer.track && consumer.track.readyState !== "ended") {
				console.log(`[Video] Creating stream from consumer for ${peerId}:`, {
					consumerId: consumer.id,
					trackId: consumer.track.id,
					trackState: consumer.track.readyState,
					paused: consumer.paused,
				});

				try {
					const newStream = new MediaStream([consumer.track]);
					console.log(`[Video] Created new MediaStream ${newStream.id} for ${peerId}`);
					return newStream;
				} catch (error) {
					console.error(`[Video] Error creating stream for ${peerId}:`, error);
					return undefined;
				}
			}

			console.log(`[Video] No valid stream source found for ${peerId}:`, {
				hasConsumer: !!consumer,
				consumerClosed: consumer?.closed,
				hasTrack: !!consumer?.track,
				trackState: consumer?.track?.readyState,
				allConsumersForPeer: consumers
					.filter((c) => c.appData.peerId === peerId)
					.map((c) => ({ id: c.id, mediaTag: c.appData.mediaTag, closed: c.closed, hasTrack: !!c.track })),
			});
			return undefined;
		} catch (error) {
			console.error(`[Video] Unexpected error in findStream for ${peerId}:`, error);
			return undefined;
		}
	}

	$: streamHasVideo = stream ? !!stream.getVideoTracks().length : false;
	$: streamHasAudio = stream ? !!stream.getAudioTracks().length : false;

	// Enhanced srcObject directive with better cleanup and error handling
	function srcObject(node: HTMLVideoElement, stream: MediaStream | undefined) {
		console.log(`[Video] srcObject directive called for ${peerId} with stream:`, stream?.id || "null");

		function updateVideoElement(newStream: MediaStream | undefined) {
			debugInfo.videoElementUpdates++;
			console.log(`[Video] Updating video element for ${peerId} (update #${debugInfo.videoElementUpdates}):`, {
				oldSrc: node.srcObject,
				newStreamId: newStream?.id || "null",
				newStreamTracks: newStream?.getTracks().length || 0,
			});

			try {
				// Always clear the old source first to ensure clean update
				if (node.srcObject) {
					console.log(`[Video] Clearing old srcObject for ${peerId}`);
					node.srcObject = null;
					// Small delay to ensure cleanup
					setTimeout(() => {
						updateWithNewStream(newStream);
					}, 10);
				} else {
					updateWithNewStream(newStream);
				}
			} catch (error) {
				console.error(`[Video] Error updating video element for ${peerId}:`, error);
			}
		}

		function updateWithNewStream(newStream: MediaStream | undefined) {
			try {
				node.srcObject = newStream || null;

				if (newStream && newStream.getTracks().length > 0) {
					console.log(`[Video] Set new srcObject for ${peerId}, attempting to play`);

					// Ensure video element is ready
					node.load();

					const playPromise = node.play();
					if (playPromise !== undefined) {
						playPromise
							.then(() => {
								console.log(`[Video] Successfully started playback for ${peerId}`);
							})
							.catch((error) => {
								console.warn(`[Video] Auto-play failed for ${peerId}:`, error);
								// Try again after a short delay
								setTimeout(() => {
									node.play().catch((e) => console.warn(`[Video] Retry play failed for ${peerId}:`, e));
								}, 500);
							});
					}
				} else {
					console.log(`[Video] No stream or tracks available for ${peerId}, video element cleared`);
				}
			} catch (error) {
				console.error(`[Video] Error setting srcObject for ${peerId}:`, error);
			}
		}

		// Initial setup
		updateVideoElement(stream);

		return {
			update(newStream: MediaStream | undefined) {
				console.log(`[Video] srcObject update triggered for ${peerId}:`, {
					oldStream: node.srcObject ? "present" : "null",
					newStreamId: newStream?.id || "null",
					streamChanged: (node.srcObject as MediaStream)?.id !== newStream?.id,
				});

				// Only update if stream actually changed
				const currentStreamId = (node.srcObject as MediaStream)?.id || null;
				const newStreamId = newStream?.id || null;

				if (currentStreamId !== newStreamId) {
					console.log(`[Video] Stream ID changed for ${peerId}: ${currentStreamId} -> ${newStreamId}`);
					updateVideoElement(newStream);
				}
			},
			destroy() {
				console.log(`[Video] srcObject directive destroyed for ${peerId}`);
				if (node.srcObject) {
					node.srcObject = null;
				}
			},
		};
	}

	// Debug function to force refresh
	function forceRefresh() {
		console.log(`[Video] Force refresh triggered for ${peerId}`);
		if (videoElement) {
			videoElement.srcObject = null;
			setTimeout(() => {
				videoElement.srcObject = stream || null;
				if (stream) {
					videoElement.play().catch((e) => console.warn(`[Video] Force refresh play failed:`, e));
				}
			}, 100);
		}
	}

	// Monitor peer online status changes
	let lastPeerOnlineStatus = peer?.online;
	$: {
		if (peer && peer.online !== lastPeerOnlineStatus) {
			console.log(`[Video] Peer ${peerId} online status changed: ${lastPeerOnlineStatus} -> ${peer.online}`);
			lastPeerOnlineStatus = peer.online;

			// Reset reconnection attempts when peer comes online
			if (peer.online) {
				reconnectionAttempts = 0;
			}
		}
	}
</script>

{#if peer && !stream}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{peer.name}
		</h1>
		{#if $debugModeStore}
			<DebugPanel {peerId} compact={true} />
			<div class="debug-info">
				<small>No Stream | Online: {peer?.online} | Session: {!!session} | Video Available: {hasVideoAvailable} | Consumer: {!!hasVideoConsumer}</small>
				<button class="button is-small is-info mt-1" on:click={forceRefresh}>Force Refresh</button>
			</div>
		{/if}
	</div>
{:else if stream}
	<div class="window">
		<h1 class="title has-text-white">
			{peer?.name}
		</h1>
		<video bind:this={videoElement} use:srcObject={stream} controls={false} autoplay playsinline muted={isLocalPeer || !streamHasAudio}></video>
		{#if $debugModeStore}
			<DebugPanel {peerId} compact={true} />
			<div class="debug-info">
				<small>
					Stream: {stream.id?.slice(-8)} | Tracks: V:{streamHasVideo ? "✓" : "✗"} A:{streamHasAudio ? "✓" : "✗"} | Changes: S:{debugInfo.streamChanges}
					C:{debugInfo.consumerChanges} | Attempts: {debugInfo.subscriptionAttempts}
				</small>
				<button class="button is-small is-info mt-1" on:click={forceRefresh}>Force Refresh</button>
			</div>
		{/if}
	</div>
{:else}
	<div class="window text-window">
		<h1 class="title has-text-white">
			{peer?.name || "Unknown Peer"}
		</h1>
		{#if $debugModeStore}
			<DebugPanel {peerId} compact={true} />
			<div class="debug-info">
				<small>No Peer Data | ID: {peerId}</small>
			</div>
		{/if}
	</div>
{/if}

<style>
	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.window {
		color: var(--channelle-main-bg-color);
		flex-grow: 0;
		flex-shrink: 0;
		flex-basis: 0;
		position: relative;
		margin: 0;
		padding: 8px;
		display: block;
		overflow: none;
		max-height: 100%;
	}

	.text-window {
		width: 100%;
		height: 100%;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		align-content: center;
		justify-items: center;
		justify-content: center;
	}

	.debug-info {
		position: absolute;
		bottom: 4px;
		left: 4px;
		right: 4px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 4px;
		font-size: 10px;
		border-radius: 2px;
		z-index: 10;
		text-align: left;
	}

	.debug-info .button {
		font-size: 8px;
		height: 16px;
		padding: 2px 6px;
	}
</style>
