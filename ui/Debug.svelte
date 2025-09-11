<script lang="ts">
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import * as Debug from "./room/debugfunctions";

	// Local state for UI
	let peerIdInput = "";
	let mediaTagInput = "";
	let statusMessage = "";
	let error = "";

	// Reactive state from debug functions
	$: myPeerId = Debug.myPeerId;
	$: joined = Debug.joined;
	$: hasLocalCam = !!Debug.localCam;
	$: hasLocalScreen = !!Debug.localScreen;
	$: hasSendTransport = !!Debug.sendTransport;
	$: hasRecvTransport = !!Debug.recvTransport;
	$: hasCamVideo = !!Debug.camVideoProducer;
	$: hasCamAudio = !!Debug.camAudioProducer;
	$: hasScreenVideo = !!Debug.screenVideoProducer;
	$: hasScreenAudio = !!Debug.screenAudioProducer;
	$: activeSpeaker = Debug.currentActiveSpeaker?.peerId || "None";
	$: consumerCount = Debug.consumers?.length || 0;

	onMount(() => {
		Debug.onPageLoad();
		// Refresh UI state periodically
		const interval = setInterval(() => {
			// Trigger reactivity
			myPeerId = Debug.myPeerId;
			joined = Debug.joined;
			hasLocalCam = !!Debug.localCam;
			hasLocalScreen = !!Debug.localScreen;
			hasSendTransport = !!Debug.sendTransport;
			hasRecvTransport = !!Debug.recvTransport;
			hasCamVideo = !!Debug.camVideoProducer;
			hasCamAudio = !!Debug.camAudioProducer;
			hasScreenVideo = !!Debug.screenVideoProducer;
			hasScreenAudio = !!Debug.screenAudioProducer;
			activeSpeaker = Debug.currentActiveSpeaker?.peerId || "None";
			consumerCount = Debug.consumers?.length || 0;
		}, 1000);

		return () => clearInterval(interval);
	});

	async function handleAction(fn: () => Promise<void>, successMsg: string) {
		try {
			error = "";
			statusMessage = "Processing...";
			await fn();
			statusMessage = successMsg;
		} catch (e: any) {
			error = `Error: ${e.message || e}`;
			statusMessage = "";
		}
	}

	async function handleToggle(fn: (paused?: boolean) => Promise<void>, currentState: boolean, type: string) {
		await handleAction(() => fn(!currentState), `${type} ${!currentState ? "paused" : "resumed"}`);
	}
</script>

<main in:blur={{ delay: 500, duration: 1000 }}>
	<h1>Debug Interface</h1>

	<div class="status-section">
		<h2>Status</h2>
		<div class="status-grid">
			<div class="status-item">
				<span class="label">My Peer ID:</span>
				<span class="value">{myPeerId}</span>
			</div>
			<div class="status-item">
				<span class="label">Joined:</span>
				<span class="value" class:active={joined}>{joined ? "Yes" : "No"}</span>
			</div>
			<div class="status-item">
				<span class="label">Local Camera:</span>
				<span class="value" class:active={hasLocalCam}>{hasLocalCam ? "Active" : "Inactive"}</span>
			</div>
			<div class="status-item">
				<span class="label">Screen Share:</span>
				<span class="value" class:active={hasLocalScreen}>{hasLocalScreen ? "Active" : "Inactive"}</span>
			</div>
			<div class="status-item">
				<span class="label">Send Transport:</span>
				<span class="value" class:active={hasSendTransport}>{hasSendTransport ? "Active" : "Inactive"}</span>
			</div>
			<div class="status-item">
				<span class="label">Receive Transport:</span>
				<span class="value" class:active={hasRecvTransport}>{hasRecvTransport ? "Active" : "Inactive"}</span>
			</div>
			<div class="status-item">
				<span class="label">Active Speaker:</span>
				<span class="value">{activeSpeaker}</span>
			</div>
			<div class="status-item">
				<span class="label">Consumers:</span>
				<span class="value">{consumerCount}</span>
			</div>
		</div>
	</div>

	<div class="producers-section">
		<h2>Producers</h2>
		<div class="status-grid">
			<div class="status-item">
				<span class="label">Camera Video:</span>
				<span class="value" class:active={hasCamVideo}>
					{hasCamVideo ? (Debug.camVideoProducer?.paused ? "Paused" : "Active") : "Inactive"}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Camera Audio:</span>
				<span class="value" class:active={hasCamAudio}>
					{hasCamAudio ? (Debug.camAudioProducer?.paused ? "Paused" : "Active") : "Inactive"}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Screen Video:</span>
				<span class="value" class:active={hasScreenVideo}>
					{hasScreenVideo ? (Debug.screenVideoProducer?.paused ? "Paused" : "Active") : "Inactive"}
				</span>
			</div>
			<div class="status-item">
				<span class="label">Screen Audio:</span>
				<span class="value" class:active={hasScreenAudio}>
					{hasScreenAudio ? (Debug.screenAudioProducer?.paused ? "Paused" : "Active") : "Inactive"}
				</span>
			</div>
		</div>
	</div>

	<div class="controls-section">
		<h2>Room Controls</h2>
		<div class="button-group">
			<button on:click={() => handleAction(Debug.joinRoom, "Joined room")} disabled={joined}> Join Room </button>
			<button on:click={() => handleAction(Debug.leaveRoom, "Left room")} disabled={!joined}> Leave Room </button>
		</div>
	</div>

	<div class="controls-section">
		<h2>Media Controls</h2>
		<div class="button-group">
			<button on:click={() => handleAction(Debug.startCamera, "Camera started")} disabled={hasLocalCam}> Start Camera </button>
			<button on:click={() => handleAction(Debug.sendCameraStreams, "Camera streams sent")} disabled={!hasLocalCam || !joined}>
				Send Camera Streams
			</button>
			<button on:click={() => handleAction(Debug.startScreenshare, "Screen share started")} disabled={!joined || hasLocalScreen}>
				Start Screen Share
			</button>
			<button on:click={() => handleAction(Debug.cycleCamera, "Camera cycled")} disabled={!hasCamVideo}> Cycle Camera </button>
			<button on:click={() => handleAction(Debug.stopStreams, "Streams stopped")} disabled={!hasSendTransport}> Stop All Streams </button>
		</div>
	</div>

	<div class="controls-section">
		<h2>Pause/Resume Controls</h2>
		<div class="button-group">
			<button on:click={() => handleToggle(Debug.changeCamPaused, Debug.getCamPausedState(), "Camera")} disabled={!hasCamVideo}>
				{Debug.getCamPausedState() ? "Resume" : "Pause"} Camera
			</button>
			<button on:click={() => handleToggle(Debug.changeMicPaused, Debug.getMicPausedState(), "Microphone")} disabled={!hasCamAudio}>
				{Debug.getMicPausedState() ? "Resume" : "Pause"} Microphone
			</button>
			<button on:click={() => handleToggle(Debug.changeScreenPaused, Debug.getScreenPausedState(), "Screen")} disabled={!hasScreenVideo}>
				{Debug.getScreenPausedState() ? "Resume" : "Pause"} Screen
			</button>
			<button on:click={() => handleToggle(Debug.changeScreenAudioPaused, Debug.getScreenAudioPausedState(), "Screen Audio")} disabled={!hasScreenAudio}>
				{Debug.getScreenAudioPausedState() ? "Resume" : "Pause"} Screen Audio
			</button>
		</div>
	</div>

	<div class="controls-section">
		<h2>Track Subscription</h2>
		<div class="input-group">
			<input type="text" placeholder="Peer ID" bind:value={peerIdInput} />
			<input type="text" placeholder="Media Tag (e.g., cam-video)" bind:value={mediaTagInput} />
		</div>
		<div class="button-group">
			<button
				on:click={() => handleAction(() => Debug.subscribeToTrack(peerIdInput, mediaTagInput), `Subscribed to ${mediaTagInput} from ${peerIdInput}`)}
				disabled={!peerIdInput || !mediaTagInput || !joined}
			>
				Subscribe to Track
			</button>
			<button
				on:click={() =>
					handleAction(() => Debug.unsubscribeFromTrack(peerIdInput, mediaTagInput), `Unsubscribed from ${mediaTagInput} from ${peerIdInput}`)}
				disabled={!peerIdInput || !mediaTagInput || !joined}
			>
				Unsubscribe from Track
			</button>
		</div>
	</div>

	<div class="controls-section">
		<h2>Device Info</h2>
		<div class="button-group">
			<button
				on:click={async () => {
					const deviceId = await Debug.getCurrentDeviceId();
					statusMessage = deviceId ? `Current device ID: ${deviceId}` : "No device ID available";
				}}
			>
				Get Current Device ID
			</button>
		</div>
	</div>

	{#if statusMessage}
		<div class="message success">{statusMessage}</div>
	{/if}

	{#if error}
		<div class="message error">{error}</div>
	{/if}
</main>

<style lang="scss">
	main {
		padding: 20px 50px;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		color: #333;
		margin-bottom: 30px;
		font-size: 2em;
	}

	h2 {
		color: #555;
		margin-top: 25px;
		margin-bottom: 15px;
		font-size: 1.4em;
		border-bottom: 2px solid #e0e0e0;
		padding-bottom: 5px;
	}

	.status-section,
	.producers-section,
	.controls-section {
		margin-bottom: 30px;
		background: #f9f9f9;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 15px;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		padding: 10px;
		background: white;
		border-radius: 4px;
		border: 1px solid #e0e0e0;

		.label {
			font-weight: 600;
			color: #666;
		}

		.value {
			color: #333;

			&.active {
				color: #4caf50;
				font-weight: 600;
			}
		}
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 10px;
	}

	.input-group {
		display: flex;
		gap: 10px;
		margin-bottom: 10px;

		input {
			flex: 1;
			padding: 8px 12px;
			border: 1px solid #ddd;
			border-radius: 4px;
			font-size: 14px;

			&:focus {
				outline: none;
				border-color: #4caf50;
			}
		}
	}

	button {
		padding: 10px 20px;
		background: #4caf50;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.3s ease;

		&:hover:not(:disabled) {
			background: #45a049;
			transform: translateY(-1px);
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}

		&:active:not(:disabled) {
			transform: translateY(0);
		}

		&:disabled {
			background: #ccc;
			cursor: not-allowed;
			opacity: 0.6;
		}
	}

	.message {
		margin-top: 20px;
		padding: 15px;
		border-radius: 4px;
		font-size: 14px;
		animation: slideIn 0.3s ease;

		&.success {
			background: #d4edda;
			color: #155724;
			border: 1px solid #c3e6cb;
		}

		&.error {
			background: #f8d7da;
			color: #721c24;
			border: 1px solid #f5c6cb;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
