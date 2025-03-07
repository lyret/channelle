<script lang="ts">
	import { windowSizeStore } from "$ui/device";
	import { createEventDispatcher, onMount } from "svelte";
	import activationSrc from "~/assets/images/click-here.gif";
	import { createEffectsStore } from "~/stores/particles/effectsStore";

	const windowSize = windowSizeStore();
	
	const effects = createEffectsStore();
	
	// Make sure effects are rendered
	onMount(() => {
		const stop = effects.subscribe(() => {});

		return () => {
			stop();
		};
	});

	const dispatcher = createEventDispatcher();
</script>

<div class="buttons">
	<div class="center">
		<button on:click={() => dispatcher("ok", {})}>
			<img src={activationSrc} />
		</button>
	</div>
</div>

<style>
	img {
		max-height: 52px;
	}
	button:hover {
		transform: scaleY(1.1);
	}
	.buttons {
		margin-left: 1%;
		margin-right: 1%;
	}
	.left {
		text-align: left;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 1;
	}
	.center {
		text-align: center;
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 1;
	}
	.right {
		text-align: right;
		flex-grow: 1;
		flex-grow: 1;
		flex-basis: 1;
	}

	@media (max-width: 768px) {
		.buttons {
			margin-left: 0px;
			margin-right: 0px;
		}
		.right,
		.left {
			text-align: left;
		}
		.left,
		.right,
		.center {
			flex-grow: 0;
		}
	}
</style>
