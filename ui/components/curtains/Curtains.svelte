<script lang="ts">
	import { onMount } from "svelte";
	import { showSceneSettingsStore } from "~/api";

	// Forces the curtains to be closed if needed from the parent component
	export let forcedToBeClosed = false;

	// Track animation and rendering state
	let animationState: "idle" | "opening" | "closing" = "idle";
	let currentState: "open" | "closed" | "unknown" = "unknown";

	$: {
		if (forcedToBeClosed) {
			if (currentState === "unknown") {
				animationState = "closing";
				currentState = "closed";
			} else {
				currentState = "unknown";
				animationState = "idle";
			}
		} else {
			if ((currentState === "closed" || currentState === "unknown") && !$showSceneSettingsStore.curtains) {
				animationState = "opening";
			}
		}
	}

	onMount(() => {
		showSceneSettingsStore.subscribe(({ curtains }) => {
			let open = !curtains;
			if (forcedToBeClosed) {
				open = false;
				return;
			}
			if (currentState === "unknown") {
				animationState = "idle";
				if (open) {
					currentState = "open";
				} else {
					currentState = "closed";
				}
				return;
			}

			if (open && currentState === "closed") {
				animationState = "opening";
			} else if (!open && currentState === "open") {
				animationState = "closing";
			}
		});
	});

	// Reset animation state after animation completes
	function handleAnimationEnd() {
		if (animationState === "opening") {
			currentState = "open";
		} else if (animationState === "closing") {
			currentState = "closed";
		}
		animationState = "idle";
	}
</script>

<div
	class="curtains-container"
	class:open={animationState === "idle" && currentState === "open"}
	class:opening={animationState === "opening"}
	class:closing={animationState === "closing"}
>
	<!-- Left curtain -->
	<div class="curtain left" on:animationend={handleAnimationEnd}>
		<div class="curtain-fabric">
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
		</div>
		<div class="curtain-shadow"></div>
	</div>

	<!-- Center curtain (splits in half) -->
	<div class="curtain center-left" on:animationend={handleAnimationEnd}>
		<div class="curtain-fabric">
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
		</div>
		<div class="curtain-shadow"></div>
	</div>

	<div class="curtain center-right" on:animationend={handleAnimationEnd}>
		<div class="curtain-fabric">
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
		</div>
		<div class="curtain-shadow"></div>
	</div>

	<!-- Right curtain -->
	<div class="curtain right" on:animationend={handleAnimationEnd}>
		<div class="curtain-fabric">
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
			<div class="curtain-fold"></div>
		</div>
		<div class="curtain-shadow"></div>
	</div>

	<!-- Valance -->
	<div class="valance">
		<div class="valance-center">
			<div class="valance-drape"></div>
			<div class="valance-drape"></div>
			<div class="valance-drape"></div>
		</div>
		<div class="valance-fringe"></div>
	</div>
</div>

<style>
	.curtains-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		max-width: calc(((100vh - 60px) / 10) * 16);
		aspect-ratio: 14/10;
		pointer-events: none;
		z-index: 9990;
		overflow: hidden;
	}

	/* Curtain base styles */
	.curtain {
		position: absolute;
		top: 0;
		height: 100%;
		overflow: hidden;
	}

	.curtain-fabric {
		width: 100%;
		height: 100%;
		background:
			repeating-linear-gradient(90deg, #8b0000 0px, #8b0000 4px, #dc143c 4px, #dc143c 8px),
			repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0px, rgba(0, 0, 0, 0.3) 2px, transparent 2px, transparent 4px),
			repeating-linear-gradient(45deg, transparent 0px, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px),
			linear-gradient(to bottom, #8b0000, #4b0000, #2b0000);
		background-size:
			8px 8px,
			4px 4px,
			4px 4px,
			100% 100%;
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
		position: relative;
		display: flex;
		flex-direction: row;
		filter: contrast(1.4) brightness(0.85) saturate(0.9);
	}

	.curtain-fabric::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image:
			repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(139, 0, 0, 0.05) 1px, rgba(139, 0, 0, 0.05) 2px),
			repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0, 0, 0, 0.05) 1px, rgba(0, 0, 0, 0.05) 2px);
		background-size:
			2px 2px,
			2px 2px;
		mix-blend-mode: multiply;
		opacity: 0.8;
		pointer-events: none;
	}

	.curtain-fold {
		flex: 1;
		height: 100%;
		position: relative;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.4) 0%, transparent 15%, transparent 85%, rgba(0, 0, 0, 0.4) 100%);
		border-right: 2px solid rgba(0, 0, 0, 0.5);
		mix-blend-mode: multiply;
	}

	.curtain-fold::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 100%;
		background: repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0, 0, 0, 0.1) 8px, rgba(0, 0, 0, 0.1) 10px);
		image-rendering: pixelated;
	}

	.curtain-shadow {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 20%;
		background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.8));
		pointer-events: none;
	}

	/* Individual curtain positioning */
	.left {
		left: 0;
		width: 25%;
		transform-origin: left center;
	}

	.center-left {
		left: 25%;
		width: 25%;
		transform-origin: right center;
	}

	.center-right {
		right: 25%;
		width: 25%;
		transform-origin: left center;
	}

	.right {
		right: 0;
		width: 25%;
		transform-origin: right center;
	}

	/* Valance styles */
	.valance {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 15%;
		min-height: 60px;
		max-height: 100px;
		background:
			repeating-linear-gradient(90deg, #8b0000 0px, #8b0000 8px, #4b0000 8px, #4b0000 16px),
			repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0px, rgba(0, 0, 0, 0.2) 1px, transparent 1px, transparent 2px),
			linear-gradient(to bottom, #4b0000, #8b0000);
		background-size:
			16px 100%,
			2px 2px,
			100% 100%;
		box-shadow:
			0 2px 0 #2b0000,
			0 4px 0 #000000,
			0 4px 8px rgba(0, 0, 0, 0.8);
		transform-origin: top center;
		border-bottom: 2px solid #2b0000;
		image-rendering: pixelated;
		filter: contrast(1.3);
	}

	.valance-center {
		display: flex;
		height: 70%;
		justify-content: space-around;
		align-items: flex-end;
	}

	.valance-drape {
		width: 30%;
		height: 80%;
		background:
			repeating-linear-gradient(180deg, #8b0000 0px, #8b0000 4px, #4b0000 4px, #4b0000 8px), radial-gradient(ellipse at bottom, #dc143c 0%, #8b0000 100%);
		border-radius: 0 0 50% 50%;
		box-shadow: inset 0 -4px 8px rgba(0, 0, 0, 0.5);
		image-rendering: pixelated;
	}

	.valance-fringe {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 30%;
		background: repeating-linear-gradient(90deg, #8b0000 0px, #8b0000 4px, transparent 4px, transparent 8px);
		image-rendering: pixelated;
	}

	.valance-fringe::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: repeating-linear-gradient(90deg, #4b0000 0px, #4b0000 2px, transparent 2px, transparent 8px);
		opacity: 0.8;
	}

	/* Closed state (default) */
	.curtains-container:not(.open) .curtain {
		transform: translateX(0) scaleX(1);
	}

	.curtains-container:not(.open) .valance {
		transform: translateY(0) scaleY(1);
	}

	/* Open state (after animation) */
	.curtains-container.open:not(.closing) .left {
		transform: translateX(-95%) scaleX(0.3);
	}

	.curtains-container.open:not(.closing) .center-left {
		transform: translateX(-200%) scaleX(0.5);
	}

	.curtains-container.open:not(.closing) .center-right {
		transform: translateX(200%) scaleX(0.5);
	}

	.curtains-container.open:not(.closing) .right {
		transform: translateX(95%) scaleX(0.3);
	}

	.curtains-container.open:not(.closing) .valance {
		transform: translateY(-85%) scaleY(0.7);
	}

	/* Opening animation */
	.curtains-container.opening .left {
		animation: curtain-open-left 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.curtains-container.opening .center-left {
		animation: curtain-open-center-left 2.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
	}

	.curtains-container.opening .center-right {
		animation: curtain-open-center-right 2.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
	}

	.curtains-container.opening .right {
		animation: curtain-open-right 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.curtains-container.opening .valance {
		animation: valance-open 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
	}

	/* Closing animation */
	.curtains-container.closing .left {
		animation: curtain-close-left 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.curtains-container.closing .center-left {
		animation: curtain-close-center-left 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.curtains-container.closing .center-right {
		animation: curtain-close-center-right 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.curtains-container.closing .right {
		animation: curtain-close-right 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	.curtains-container.closing .valance {
		animation: valance-close 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}

	/* Opening animations */
	@keyframes curtain-open-left {
		0% {
			transform: translateX(0) scaleX(1);
		}
		40% {
			transform: translateX(-10%) scaleX(0.95);
		}
		100% {
			transform: translateX(-95%) scaleX(0.3);
		}
	}

	@keyframes curtain-open-center-left {
		0% {
			transform: translateX(0) scaleX(1);
		}
		30% {
			transform: translateX(-5%) scaleX(0.98);
		}
		100% {
			transform: translateX(-200%) scaleX(0.5);
		}
	}

	@keyframes curtain-open-center-right {
		0% {
			transform: translateX(0) scaleX(1);
		}
		30% {
			transform: translateX(5%) scaleX(0.98);
		}
		100% {
			transform: translateX(200%) scaleX(0.5);
		}
	}

	@keyframes curtain-open-right {
		0% {
			transform: translateX(0) scaleX(1);
		}
		40% {
			transform: translateX(10%) scaleX(0.95);
		}
		100% {
			transform: translateX(95%) scaleX(0.3);
		}
	}

	@keyframes valance-open {
		0% {
			transform: translateY(0) scaleY(1);
		}
		100% {
			transform: translateY(-85%) scaleY(0.7);
		}
	}

	/* Closing animations */
	@keyframes curtain-close-left {
		0% {
			transform: translateX(-95%) scaleX(0.3);
		}
		60% {
			transform: translateX(-10%) scaleX(0.95);
		}
		100% {
			transform: translateX(0) scaleX(1);
		}
	}

	@keyframes curtain-close-center-left {
		0% {
			transform: translateX(-200%) scaleX(0.5);
		}
		70% {
			transform: translateX(-5%) scaleX(0.98);
		}
		100% {
			transform: translateX(0) scaleX(1);
		}
	}

	@keyframes curtain-close-center-right {
		0% {
			transform: translateX(200%) scaleX(0.5);
		}
		70% {
			transform: translateX(5%) scaleX(0.98);
		}
		100% {
			transform: translateX(0) scaleX(1);
		}
	}

	@keyframes curtain-close-right {
		0% {
			transform: translateX(95%) scaleX(0.3);
		}
		60% {
			transform: translateX(10%) scaleX(0.95);
		}
		100% {
			transform: translateX(0) scaleX(1);
		}
	}

	@keyframes valance-close {
		0% {
			transform: translateY(-85%) scaleY(0.7);
		}
		100% {
			transform: translateY(0) scaleY(1);
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.curtains-container {
			max-width: calc(((100vh - 120px) / 10) * 16);
		}

		.valance {
			height: 12%;
			min-height: 40px;
			max-height: 60px;
		}

		/* Adjust open positions for mobile */
		.curtains-container.open:not(.closing) .left {
			transform: translateX(-90%) scaleX(0.4);
		}

		.curtains-container.open:not(.closing) .right {
			transform: translateX(90%) scaleX(0.4);
		}

		@keyframes curtain-open-left {
			100% {
				transform: translateX(-90%) scaleX(0.4);
			}
		}

		@keyframes curtain-open-right {
			100% {
				transform: translateX(90%) scaleX(0.4);
			}
		}

		@keyframes curtain-close-left {
			0% {
				transform: translateX(-90%) scaleX(0.4);
			}
		}

		@keyframes curtain-close-right {
			0% {
				transform: translateX(90%) scaleX(0.4);
			}
		}
	}
</style>
