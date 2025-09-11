<script lang="ts">
	import { blur } from "svelte/transition";
	import logoSrc from "~/assets/images/masks.gif";
	import { APIStore } from "~/lib/stores/api";

	import Authenticate from "~/components/curtains/AuthenticateCurtainMessage.svelte";
	import Blocked from "~/components/curtains/BlockedCurtainMessage.svelte";
	import Continue from "~/components/curtains/ContinueCurtainMessage.svelte";
	import Curtains from "~/components/curtains/Curtains.svelte";
	import Loader from "~/components/curtains/LoadingCurtainMessage.svelte";
	import Problem from "~/components/curtains/ProblemCurtainMessage.svelte";
	import BackstagePage from "~/pages/Backstage.svelte";
	import HomePage from "~/pages/Home.svelte";
	import DebugStagePage from "~/pages/DebugStagePage.svelte";
	import StagePage from "~/pages/Stage.svelte";
	import { scenePasswordIsOk } from "./stores/scene/scenePassword";

	import PasswordCurtainMessage from "./components/curtains/PasswordCurtainMessage.svelte";
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
	$: renderStage = window.location.pathname.indexOf("/stage") == 0;
	$: renderHome = window.location.pathname == "/" || window.location.pathname.indexOf("/home") == 0;
	$: renderBackstage = window.location.pathname.indexOf("/backstage") == 0;
	$: needToBeManager = renderBackstage && !($APIStore.status == "ready" && $APIStore.participant.manager);
	$: needStagePassword = !$scenePasswordIsOk && renderStage;
	$: renderMessages =
		!determiningState &&
		(renderBackstage || renderStage) &&
		(isPreparing || !hasEnteredName || !hasInteractedWithTheDocument || isBlocked || needStagePassword || needToBeManager);
	$: renderContent = !determiningState && !renderMessages;
	$: renderCurtains = determiningState || renderMessages || ($sceneCurtains && renderStage);
</script>

<!-- Content -->
{#if renderContent}
	{#if renderHome}
		<HomePage />
	{:else if renderStage}
		<StagePage />
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
		<div class="menu" in:blur={{ duration: 1000 }} out:blur={{ duration: 500 }}>
			<img class="logo" src={logoSrc} alt="Channelle" />
			{#if name}<h1 class="title is-family-title">{name}</h1>{/if}
			{#if isBlocked}
				<Blocked />
			{:else if $APIStore.status == "ready" && !hasEnteredName}
				<Authenticate participant={$APIStore.participant} on:submit={() => (hasInteractedWithTheDocument = true)} />
			{:else if $APIStore.status == "ready" && !hasInteractedWithTheDocument}
				<Continue participant={$APIStore?.participant} on:click={() => (hasInteractedWithTheDocument = true)} />
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
		width: 20%;
		margin-bottom: 24px;
		transition: width, margin-bottom, 1s;

		@include mobile {
			width: 70%;
			margin-bottom: 14px;
		}
	}

	.menu {
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
		background-color: var(--channelle-menu-bg-color);
		color: var(--channelle-menu-text-color);

		.title {
			font-size: 32px;
			color: var(--channelle-menu-text-color);
			@include mobile {
				font-size: 32px;
			}
		}

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
