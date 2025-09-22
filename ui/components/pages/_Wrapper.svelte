<script lang="ts">
	import { onMount } from "svelte";
	declare const CONFIG: any;

	//TODO: re-add
	// import { blur } from "svelte/transition";
	// import logoSrc from "~/assets/images/masks.gif";
	// import AuthenticateCurtainMessage from "~/components/curtains/AuthenticateCurtainMessage.svelte";
	// import BlockedCurtainMessage from "~/components/curtains/BlockedCurtainMessage.svelte";
	// import ContinueCurtainMessage from "~/components/curtains/ContinueCurtainMessage.svelte";
	// import LoaderCurtainMessage from "~/components/curtains/LoadingCurtainMessage.svelte";
	// import ProblemCurtainMessage from "~/components/curtains/ProblemCurtainMessage.svelte";
	// import PasswordCurtainMessage from "~/components/curtains/PasswordCurtainMessage.svelte";
	// import Curtains from "~/components/curtains/Curtains.svelte";

	// import { scenePasswordIsOk } from "~/stores/scene/scenePassword";
	// import { sceneCurtains } from "~/stores/scene/sceneCurtains";

	console.log(CONFIG.stage.name, "HERE");
	// Delays the rendering of any content to avoid the "pop-in" effect
	// on initial rendering due to initial determination of state
	let determiningState = true;
	onMount(() => {
		setTimeout(() => {
			determiningState = false;
		}, 400);
	});

	/** Being a manager is neccessary to access this page */
	export let lockedToManager = false;

	/** Entering the Invite key is neccessary to access this page */
	export let lockedToInviteKey = false;

	/** If true shows a simple message to catch the first interaction with the document before rendering the content */
	export let hasInteractedWithTheDocument = !CONFIG.runtime.production;

	// Determine what should be rendered
	// $: isBlocked = $APIStore.status == "blocked";
	// $: isPreparing = $APIStore.isReady == false;
	// $: hasEnteredName = !isPreparing && $APIStore.participant.name;
	// $: needsToBeManager = lockedToManager && !(!isPreparing && $APIStore.participant.manager);
	// $: needsInviteKey = lockedToInviteKey && !$scenePasswordIsOk;
	// $: renderMessages =
	// 	!determiningState && (isPreparing || !hasEnteredName || !hasInteractedWithTheDocument || isBlocked || needsInviteKey || needsToBeManager);
	// $: renderContent = !determiningState && !renderMessages;
	// $: renderCurtains = determiningState || renderMessages || ($sceneCurtains && renderStage);
</script>

<!-- Content -->
<!-- {#if renderContent && $$slots.default}
	<slot></slot>
{/if} -->

<!-- Curtains -->
<!-- {#if renderCurtains}
	<Curtains />
{/if} -->

<!-- TODO: re-add Curtain Messages -->
<!-- {#if renderMessages}
	<div class="overlay">
		<div class="menu" in:blur={{ duration: 1000 }} out:blur={{ duration: 500 }}>
			<img class="logo" src={logoSrc} alt="Channelle" />
			{#if CONFIG.stage.name}<h1 class="title is-family-title">{CONFIG.stage.name}</h1>{/if}
			{#if isBlocked}
				<BlockedCurtainMessage />
			{:else if $APIStore.status == "ready" && !hasEnteredName}
				<AuthenticateCurtainMessage participant={$APIStore.participant} on:submit={() => (hasInteractedWithTheDocument = true)} />
			{:else if $APIStore.status == "ready" && !hasInteractedWithTheDocument}
				<ContinueCurtainMessage participant={$APIStore?.participant} on:click={() => (hasInteractedWithTheDocument = true)} />
			{:else if isPreparing}
				<LoaderCurtainMessage label="Ansluter..." />
			{:else if needsToBeManager}
				<BlockedCurtainMessage message="Sidan är endast för tekniker" />
			{:else if needsInviteKey}
				<PasswordCurtainMessage />
			{:else}
				<ProblemCurtainMessage />
			{/if}
		</div>
	</div>
{/if} -->

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
