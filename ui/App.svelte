<script lang="ts">
	import { APIStore } from '~/lib/stores/api';
	import { blur } from 'svelte/transition';
	import { route } from '~/stores/ui/url';
	import flowerSrc from '~/assets/images/flower.png';

	import Curtains from '~/components/curtains/Curtains.svelte';
	import Loader from '~/components/curtains/LoadingCurtainMessage.svelte';
	import Authenticate from '~/components/curtains/AuthenticateCurtainMessage.svelte';
	import Blocked from '~/components/curtains/BlockedCurtainMessage.svelte';
	import Problem from '~/components/curtains/ProblemCurtainMessage.svelte';
	import ManagePage from '~/pages/Backstage.svelte';
	import StagePage from '~/pages/Stage.svelte';
	import { scenePasswordIsOk } from './stores/scene/scenePassword';
	import PasswordCurtainMessage from './components/curtains/PasswordCurtainMessage.svelte';

	import { sceneCurtains } from './stores/scene/sceneCurtains';

	// Delays the rendering of any content to avoid the "pop-in" effect
	// on initial rendering due to initial determination of state
	let determiningState = true;
	setTimeout(() => {
		determiningState = false;
	}, 1000);

	// Determine what should be rendered
	$: isBlocked = $APIStore.status == 'blocked';
	$: isPreparing = $APIStore.isReady == false;
	$: hasEnteredName = $APIStore.status == 'ready' && $APIStore.participant.name;
	$: renderStage = $route && $route.group == 'stage';
	$: renderBackstage = $route && $route.group == 'backstage';
	$: needPassword = !$scenePasswordIsOk && renderStage;
	$: renderMessages =
		!determiningState &&
		(isPreparing || !hasEnteredName || isBlocked || needPassword);
	$: renderContent =
		!determiningState && !renderMessages && (renderStage || renderBackstage);
	$: renderCurtains =
		!determiningState &&
		(isPreparing ||
			!hasEnteredName ||
			isBlocked ||
			needPassword ||
			($sceneCurtains && renderStage) ||
			(!renderStage && !renderBackstage));
</script>

<!-- Content -->

{#if renderContent}
	{#if renderStage}
		<StagePage />
	{:else if renderBackstage}
		<ManagePage />
	{/if}
{/if}

<!-- Curtains -->
{#if renderCurtains}
	<Curtains />
{/if}

<!-- Curtain Messages -->
{#if renderMessages}
	<div class="overlay">
		<div
			class="notification"
			in:blur={{ duration: 1000 }}
			out:blur={{ duration: 500 }}
		>
			<img class="logo" src={flowerSrc} alt="a kalidoscope of a flower " />
			<h1 class="title is-family-title is-size-1">Chanelle</h1>
			{#if isBlocked}
				<Blocked />
			{:else if $APIStore.status == 'ready' && !hasEnteredName}
				<Authenticate participant={$APIStore.participant} />
			{:else if isPreparing}
				<Loader label={'Ansluter...'} />
			{:else if needPassword}
				<PasswordCurtainMessage />
			{:else}
				<Problem />
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		z-index: 9999;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
		justify-content: center;
		align-items: center;
		align-content: center;
		overflow: none;
	}

	.overlay .notification {
		width: 40%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;
		justify-items: center;
		align-items: center;
		text-align: center;
		padding: 24px;
		background-color: hsla(
			var(--bulma-notification-h),
			var(--bulma-notification-s),
			var(--bulma-notification-background-l),
			0.8
		);
		-webkit-backdrop-filter: blur(10px);
		backdrop-filter: blur(10px);
		transition: height 2s;
	}

	img.logo {
		max-width: 300px;
		width: 40%;
		margin-bottom: 24px;
	}
</style>
