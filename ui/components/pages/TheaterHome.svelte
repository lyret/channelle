<script lang="ts">
	import { onMount } from "svelte";

	let currentTime = new Date();
	let greeting = "Welcome to Theater";

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		return () => clearInterval(interval);
	});

	function handleGetStarted() {
		alert("Theater interface is ready! This is a POC.");
	}
</script>

<main class="theater-container">
	<header class="theater-header">
		<h1>🎭 Theater Interface</h1>
		<p class="subtitle">A simple proof of concept</p>
	</header>

	<section class="theater-content">
		<div class="welcome-card">
			<h2>{greeting}</h2>
			<p>Current time: {currentTime.toLocaleTimeString()}</p>

			<div class="theater-status">
				<div class="status-item">
					<span class="status-label">Status:</span>
					<span class="status-value online">Online</span>
				</div>
				<div class="status-item">
					<span class="status-label">Theater Server:</span>
					<span class="status-value">Connected</span>
				</div>
			</div>

			<button class="get-started-btn" on:click={handleGetStarted}>
				Get Started
			</button>
		</div>
	</section>

	<footer class="theater-footer">
		<p>Theater Interface POC - Built with Svelte</p>
	</footer>
</main>

<style lang="scss">
	.theater-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		text-align: center;
	}

	.theater-header {
		margin-bottom: 2rem;

		h1 {
			font-size: 3rem;
			margin: 0;
			background: linear-gradient(45deg, var(--theater-accent-color), var(--theater-secondary-color));
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.subtitle {
			font-size: 1.2rem;
			opacity: 0.8;
			margin: 0.5rem 0;
		}
	}

	.theater-content {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.welcome-card {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		min-width: 400px;

		h2 {
			color: var(--theater-accent-color);
			margin-bottom: 1rem;
		}

		p {
			margin-bottom: 1.5rem;
			font-size: 1.1rem;
		}
	}

	.theater-status {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		margin: 1.5rem 0;
		text-align: left;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-label {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
	}

	.status-value {
		font-weight: 500;

		&.online {
			color: var(--theater-secondary-color);
		}
	}

	.get-started-btn {
		background: linear-gradient(45deg, var(--theater-accent-color), var(--theater-secondary-color));
		border: none;
		color: white;
		padding: 12px 24px;
		font-size: 1rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 600;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.theater-footer {
		margin-top: 2rem;
		opacity: 0.6;
		font-size: 0.9rem;
	}
</style>
