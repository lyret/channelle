<script lang="ts">
	import { windowSizeStore } from '$ui/device';
	import { fullScreenAction } from '~/legos/actions/fullScreenAction';
	import { isInFullscreen } from '~/legos/stores/fullscreenStore';
	import { createEventDispatcher, onMount } from 'svelte';
	import { blur } from 'svelte/transition';
	import { update } from '~/lib';
	import { currentParticipant } from '~/lib/stores/api';
	import { createEffectsStore } from '~/stores/particles/effectsStore';
	import activationSrc from '~/assets/images/click-here.gif';

	let windowSize = windowSizeStore();
	$: isMobile = $windowSize.width <= 768;
	let isFullscreen = isInFullscreen();
	let effects = createEffectsStore();

	async function updateName() {
		const currentName = $currentParticipant.name;
		const newName =
			window.prompt('Byt namn till...', currentName) || currentName;
		await update('participant', {
			where: { id: $currentParticipant.id },
			data: { name: newName },
		});
	}

	// Make sure effects are rendered
	onMount(() => {
		const stop = effects.subscribe(() => {});

		return () => {
			stop();
		};
	});

	const dispatcher = createEventDispatcher();

	// Class list of all buttons in the action bar
	const btnClassList = 'button is-small';
	const effectBtnClassList =
		'button effect is-small is-danger is-rounded is-light is-outlined is-warning';
	const iconClassList = 'icon is-size-4';
</script>

<div class="buttons">
	<div class="center">
		<button on:click={() => dispatcher('ok', {})}>
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
