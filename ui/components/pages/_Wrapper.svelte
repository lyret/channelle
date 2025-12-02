<script lang="ts">
	import { blur } from "svelte/transition";

	import { hasAutenticated, currentPeerIsBannedStore, currentPeerStore } from "~/api";
	import { showMetadataStore, showSceneSettingsStore } from "~/api/backstage";

	import AuthenticateCurtainMessage from "~/components/curtains/AuthenticateCurtainMessage.svelte";
	import BlockedCurtainMessage from "~/components/curtains/BlockedCurtainMessage.svelte";
	import ContinueCurtainMessage from "~/components/curtains/ContinueCurtainMessage.svelte";
	import LoaderCurtainMessage from "~/components/curtains/LoadingCurtainMessage.svelte";
	import ProblemCurtainMessage from "~/components/curtains/ProblemCurtainMessage.svelte";
	import PasswordCurtainMessage from "~/components/curtains/PasswordCurtainMessage.svelte";
	import Curtains from "~/components/curtains/Curtains.svelte";

	import logoSrc from "~/assets/images/masks.gif";

	import { isStagePasswordOkStore } from "~/stores/stage";

	/** Being a manager is neccessary to access this page */
	export let lockedToManager = false;

	/** The curtains will be shown on this page if triggered remotly */
	export let curtainsAreEnabled = false;

	/** Entering the Invite key is neccessary to access this page */
	export let lockedToInviteKey = false;

	/** If true shows a simple message to catch the first interaction with the document before rendering the content */
	export let hasInteractedWithTheDocument = !CONFIG.runtime.production;

	// Determine what should be rendered
	$: hasEnteredName = $hasAutenticated && $currentPeerStore.name;
	$: needsToBeManager = lockedToManager && !($hasAutenticated && $currentPeerStore.manager);
	$: needsInviteKey = lockedToInviteKey && !$isStagePasswordOkStore;
	$: renderMessages =
		!$hasAutenticated || !hasEnteredName || !hasInteractedWithTheDocument || $currentPeerIsBannedStore || needsInviteKey || needsToBeManager;
	$: renderContent = !renderMessages;
	$: renderCurtains = renderMessages || (curtainsAreEnabled && $showSceneSettingsStore.curtains);
</script>

<!-- Content -->
{#if renderContent && $$slots.default}
	<slot></slot>
{/if}

<!-- Curtains -->
{#if renderCurtains}
	<Curtains />
{/if}

<!-- TODO: re-add Curtain Messages -->
{#if renderMessages}
	<div class="overlay">
		<div class="menu" in:blur={{ duration: 1000 }} out:blur={{ duration: 500 }}>
			<img class="logo" src={logoSrc} alt="Channelle" />
			{#if $showMetadataStore.name}<h1 class="title is-family-title">{$showMetadataStore.name}</h1>{/if}
			{#if $currentPeerIsBannedStore}
				<BlockedCurtainMessage />
			{:else if $hasAutenticated && !hasEnteredName}
				<AuthenticateCurtainMessage on:submit={() => (hasInteractedWithTheDocument = true)} />
			{:else if $hasAutenticated && !hasInteractedWithTheDocument}
				<ContinueCurtainMessage on:submit={() => (hasInteractedWithTheDocument = true)} />
			{:else if !$hasAutenticated}
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
		background-color: rgba(var(--bulma-scheme-main-rgb), 1);
		backdrop-filter: blur(5px);
		-webkit-backdrop-filter: blur(5px);
		color: var(--channelle-menu-text-color);

		/* Global styles for all curtain message components */
		:global(.button) {
			color: var(--channelle-menu-text-color);
			background-color: rgba(var(--bulma-scheme-main-rgb), 0.85);
			border: none;
			text-decoration: underline;
		}

		:global(.input) {
			color: var(--channelle-menu-text-color);
			background: rgba(var(--bulma-scheme-main-rgb), 0.1);
			border: none;
			box-shadow: none;
			border-bottom: 2px solid rgba(var(--bulma-scheme-main-rgb), 0.5);
		}

		:global(.progress) {
			--bulma-progress-value-background-color: var(--channelle-menu-text-color);
			--bulma-progress-bar-background-color: rgba(var(--bulma-scheme-main-rgb), 0.85);
			color: var(--channelle-main-text-color);
			background: rgba(var(--bulma-scheme-main-rgb), 0.2);
		}

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
