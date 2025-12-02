<script lang="ts">
	import { blur } from "svelte/transition";

	import { hasAutenticated, currentPeerIsBannedStore, currentPeerStore } from "~/api";

	import BlockedCurtainMessage from "~/components/curtains/BlockedCurtainMessage.svelte";
	import LoaderCurtainMessage from "~/components/curtains/LoadingCurtainMessage.svelte";
	import ProblemCurtainMessage from "~/components/curtains/ProblemCurtainMessage.svelte";
	import PasswordCurtainMessage from "~/components/curtains/PasswordCurtainMessage.svelte";
	import Entrance from "~/components/curtains/Entrance.svelte";
	import Curtains from "~/components/curtains/Curtains.svelte";
	import FloatingImage from "~/components/home/FloatingImage.svelte";

	import rosesSrc from "~/assets/images/roses.gif";
	import logoSrc from "~/assets/images/masks.gif";

	import { isStagePasswordOkStore } from "~/stores/stage";

	/** Being a manager is neccessary to access this page */
	export let lockedToManager = false;

	/** Entering the Invite key is neccessary to access this page */
	export let lockedToInviteKey = false;

	/** If true shows a simple message to catch the first interaction with the document before rendering the content */
	export let hasInteractedWithTheDocument = false;

	// Determine what should be rendered
	$: hasEnteredName = $hasAutenticated && $currentPeerStore.name;
	$: needsToBeManager = lockedToManager && !($hasAutenticated && $currentPeerStore.manager);
	$: needsInviteKey = lockedToInviteKey && !$isStagePasswordOkStore;
	$: renderMessages =
		!$hasAutenticated || !hasEnteredName || !hasInteractedWithTheDocument || $currentPeerIsBannedStore || needsInviteKey || needsToBeManager;
	$: renderContent = !renderMessages;
</script>

<!-- Content -->
{#if renderContent && $$slots.default}
	<slot></slot>
{/if}

<!-- Curtains -->
<Curtains forcedToBeClosed={renderMessages} />

{#if renderMessages}
	<div class="overlay">
		{#if $hasAutenticated && (!hasEnteredName || !hasInteractedWithTheDocument)}
			<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={9993} />
			<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={9993} />
			<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={9993} />
			<FloatingImage src={rosesSrc} alt="two roses shining" zIndex={9993} />
			<div class="menu" in:blur={{ duration: 1000 }} out:blur={{ duration: 500 }}>
				<img class="logo" src={logoSrc} alt="Online Teater" />
				<Entrance on:submit={() => (hasInteractedWithTheDocument = true)} />
			</div>
		{:else}
			<div class="menu" in:blur={{ duration: 1000 }} out:blur={{ duration: 500 }}>
				<img class="logo" src={logoSrc} alt="Online Teater" />
				{#if $currentPeerIsBannedStore}
					<BlockedCurtainMessage />
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
		{/if}
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
		position: relative;
		z-index: 9993 !important;
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
		background-color: rgba(var(--bulma-scheme-main-rgb), 0.8);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		color: var(--channelle-menu-text-color);

		.logo {
			max-width: 120px;
			margin-bottom: 1rem;
			animation: float 3s ease-in-out infinite;
		}

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
		z-index: 9990;
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

	/* Global style to ensure confetti effects appear above curtains */
	:global(canvas) {
		z-index: 9992 !important;
	}
</style>
