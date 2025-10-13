<script lang="ts">
	import { DebugPanel, PeerMediaStatus, ConnectionStatus, SessionStats } from "./index";
	import { debugModeStore } from "~/stores/debugMode";

	// Example peer data - in real usage this would come from stores
	const examplePeerId = "peer-123";
	const examplePeerData = {
		name: "John Doe",
		online: true,
		actor: false,
		manager: true,
		banned: false,
	};

	const exampleSessionData = {
		media: {
			"cam-video": { paused: false },
			"mic-audio": { paused: true },
		},
	};
</script>

<div class="debug-examples">
	<h1 class="title">Debug Components Examples</h1>

	<!-- Example 1: Compact Debug Panel (for Video overlay) -->
	<div class="example-section">
		<h2 class="subtitle">1. Compact Debug Panel (Video Overlay)</h2>
		<div class="example-container video-container">
			<div class="mock-video">
				<span>Video Player Area</span>
				<!-- This is how you'd use it in Video.svelte -->
				{#if $debugModeStore}
					<DebugPanel peerId={examplePeerId} compact={true} />
				{/if}
			</div>
		</div>
		<div class="code-example">
			<pre><code
					>{`<!-- In Video.svelte -->
{#if $debugModeStore}
  <DebugPanel {peerId} compact={true} />
{/if}`}</code
				></pre>
		</div>
	</div>

	<!-- Example 2: Full Debug Panel -->
	<div class="example-section">
		<h2 class="subtitle">2. Full Debug Panel</h2>
		<DebugPanel peerId={examplePeerId} compact={false} />
	</div>

	<!-- Example 3: Individual Components -->
	<div class="example-section">
		<h2 class="subtitle">3. Individual Debug Components</h2>

		<div class="columns">
			<div class="column is-6">
				<h3 class="subtitle is-5">Peer Media Status</h3>
				<PeerMediaStatus peerId={examplePeerId} peerData={examplePeerData} sessionData={exampleSessionData} isActiveSpeaker={false} />
			</div>

			<div class="column is-6">
				<h3 class="subtitle is-5">Connection Status</h3>
				<ConnectionStatus peerId={examplePeerId} peerData={examplePeerData} isOnline={true} hasTransport={true} isMyPeer={false} />
			</div>
		</div>
	</div>

	<!-- Example 4: Session Statistics -->
	<div class="example-section">
		<h2 class="subtitle">4. Session Statistics Overview</h2>
		<SessionStats />
	</div>

	<!-- Example 5: Integration Tips -->
	<div class="example-section">
		<h2 class="subtitle">5. Integration Examples</h2>

		<div class="content">
			<h4>Common Integration Patterns:</h4>

			<h5>1. Video Component Overlay:</h5>
			<pre><code
					>{`<!-- Video.svelte -->
<div class="video-container">
  <video src={stream} />
  {#if $debugModeStore}
    <DebugPanel {peerId} compact={true} />
  {/if}
</div>`}</code
				></pre>

			<h5>2. Peer List Enhancement:</h5>
			<pre><code
					>{`<!-- PeerList.svelte -->
{#each peers as peer}
  <div class="peer-item">
    <span>{peer.name}</span>
    {#if $debugModeStore}
      <ConnectionStatus
        peerId={peer.id}
        peerData={peer}
        isOnline={peer.online}
        hasTransport={peer.hasTransport}
        isMyPeer={peer.id === myPeerId}
      />
    {/if}
  </div>
{/each}`}</code
				></pre>

			<h5>3. Admin Dashboard:</h5>
			<pre><code
					>{`<!-- AdminPanel.svelte -->
{#if $peerStore.manager && $debugModeStore}
  <div class="admin-debug">
    <SessionStats />
    <DebugView />
  </div>
{/if}`}</code
				></pre>

			<h5>4. Conditional Debug Routes:</h5>
			<pre><code
					>{`<!-- App.svelte or router -->
{#if $debugModeStore}
  <Route path="/debug" component={DebugView} />
{/if}`}</code
				></pre>
		</div>
	</div>
</div>

<style lang="scss">
	.debug-examples {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.example-section {
		margin-bottom: 3rem;
		padding: 1.5rem;
		border: 1px solid #dbdbdb;
		border-radius: 6px;
		background: #fafafa;
	}

	.example-container {
		margin-bottom: 1rem;
	}

	.video-container {
		position: relative;
		width: 400px;
		height: 225px;
		background: #000;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mock-video {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
	}

	.code-example {
		background: #f5f5f5;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		padding: 1rem;
		margin-top: 1rem;

		pre {
			margin: 0;
			background: none;
			padding: 0;
		}

		code {
			font-size: 0.875rem;
			color: #363636;
		}
	}

	.content {
		h4 {
			color: #363636;
			font-weight: 600;
			margin-bottom: 1rem;
		}

		h5 {
			color: #4a4a4a;
			font-weight: 500;
			margin: 1.5rem 0 0.5rem 0;
		}

		pre {
			background: #f8f8f8;
			border: 1px solid #e8e8e8;
			border-radius: 4px;
			padding: 1rem;
			margin: 0.5rem 0 1rem 0;
			overflow-x: auto;
		}

		code {
			font-size: 0.8rem;
			color: #333;
		}
	}

	.title,
	.subtitle {
		color: #363636;
	}

	.columns {
		margin-top: 1rem;
	}
</style>
