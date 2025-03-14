<script lang="ts">
	import { blur } from "svelte/transition";
	import logoSrc from "~/assets/images/logo-free.gif";
	import { APIStore } from "~/lib/stores/api";

	import Authenticate from "~/components/curtains/AuthenticateCurtainMessage.svelte";
	import Blocked from "~/components/curtains/BlockedCurtainMessage.svelte";
	import Continue from "~/components/curtains/ContinueCurtainMessage.svelte";
	import Curtains from "~/components/curtains/Curtains.svelte";
	import Loader from "~/components/curtains/LoadingCurtainMessage.svelte";
	import Problem from "~/components/curtains/ProblemCurtainMessage.svelte";
	import BackstagePage from "~/pages/Backstage.svelte";
	import PlaygroundPage from "~/pages/Playground.svelte";
	import StagePage from "~/pages/Stage.svelte";
	import PasswordCurtainMessage from "./components/curtains/PasswordCurtainMessage.svelte";
	import { scenePasswordIsOk } from "./stores/scene/scenePassword";

	import { sceneCurtains } from "./stores/scene/sceneCurtains";

	export let name: string = "";
	let hasInteractedWithTheDocument = !CONFIG.runtime.production;

	// Delays the rendering of any content to avoid the "pop-in" effect
	// on initial rendering due to initial determination of state
	let determiningState = true;
	setTimeout(() => {
		determiningState = false;
	}, 1000);

	// Determine what should be rendered
	$: isBlocked = $APIStore.status == "blocked";
	$: isPreparing = $APIStore.isReady == false;
	$: hasEnteredName = $APIStore.status == "ready" && $APIStore.participant.name;
	$: renderStage =
		window.location.pathname == "/" ||
		window.location.pathname.indexOf("/stage") == 0;
	$: renderPlayground = window.location.pathname.indexOf("/playground") == 0;
	$: renderBackstage = window.location.pathname.indexOf("/backstage") == 0;
	$: needToBeManager =
		renderBackstage &&
		!($APIStore.status == "ready" && $APIStore.participant.manager);
	$: needStagePassword = !$scenePasswordIsOk && renderStage;
	$: renderMessages =
		!determiningState &&
		(isPreparing ||
			!hasEnteredName ||
			!hasInteractedWithTheDocument ||
			isBlocked ||
			needStagePassword ||
			needToBeManager);
	$: renderContent =
		!determiningState &&
		!renderMessages &&
		(renderStage || renderBackstage || renderPlayground);
	$: renderCurtains =
		!determiningState &&
		(isPreparing ||
			!hasEnteredName ||
			isBlocked ||
			needStagePassword ||
			($sceneCurtains && renderStage));
</script>

<!-- Content -->
{#if renderContent}
	{#if renderStage}
		<StagePage />
	{:else if renderPlayground}
		<PlaygroundPage />
	{:else if renderBackstage}
		<BackstagePage />
	{:else}
		<Curtains />
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
			class="notification is-primary"
			in:blur={{ duration: 1000 }}
			out:blur={{ duration: 500 }}
		>
			<img class="logo" src={logoSrc} alt="Channelle" />
			{#if name}<h1 class="title is-family-title">{name}</h1>{/if}
			{#if isBlocked}
				<Blocked />
			{:else if $APIStore.status == "ready" && !hasEnteredName}
				<Authenticate
					participant={$APIStore.participant}
					on:submit={() => (hasInteractedWithTheDocument = true)}
				/>
			{:else if $APIStore.status == "ready" && !hasInteractedWithTheDocument}
				<Continue
					participant={$APIStore?.participant}
					on:click={() => (hasInteractedWithTheDocument = true)}
				/>
			{:else if isPreparing}
				<Loader label="Ansluter..." />
			{:else if needToBeManager}
				<Blocked message="Sidan är endast för tekniker" />
			{:else if needStagePassword}
				<PasswordCurtainMessage />
			{:else}
				<Problem />
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	img.logo {
		width: 100%;
		margin-bottom: 24px;
		transition: width, margin-bottom, 1s;

		@include mobile {
			width: 70%;
			margin-bottom: 14px;
		}
	}
	:global {
		.overlay > .notification > h1.title {
			font-size: 32px;
			transition: font-size, 1s;

			@include mobile {
				font-size: 24px;
			}
		}
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
		transition:
			height,
			width 1s;

		@include tablet {
			width: 70%;
			max-width: unset;
		}
		@include mobile {
			width: 90%;
			max-width: unset;
		}
	}
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
</style>
