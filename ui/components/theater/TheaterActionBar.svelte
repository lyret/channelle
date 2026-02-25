<script lang="ts">
	import { blur } from "svelte/transition";
	import IconUser from "~/components/picol/icons/Picol-user-close.svelte";
	import IconInfo from "~/components/picol/icons/Picol-book-sans-information.svelte";

	import { isTheaterAuthenticated, endAdminAuthorization } from "~/api/auth";
	import { openAuthModal, openAboutModal } from "~/stores/theater/theaterModals";

	function handleSignIn() {
		if ($isTheaterAuthenticated) {
			endAdminAuthorization();
		} else {
			openAuthModal();
		}
	}

	function handleAbout() {
		openAboutModal();
	}

	// Action bar styling classes matching ActionBar component
	const btnClassList = "button is-small is-special";
	const iconClassList = "icon is-size-4";
</script>

<div class="theater-action-bar">
	<!-- Sign In / User Status -->
	<button class={btnClassList} class:active={$isTheaterAuthenticated} on:click={handleSignIn}>
		<span class={iconClassList}>
			<IconUser />
		</span>
		<span class="is-family-secondary">
			{$isTheaterAuthenticated ? "Logga ut" : "Logga in"}
		</span>
	</button>

	<!-- Buttons Slot -->
	<slot default />

	<!-- Spacer -->
	<div class="spacer" />

	<!-- About -->
	<button class={btnClassList} on:click={handleAbout} transition:blur>
		<span class={iconClassList}>
			<IconInfo />
		</span>
		<span class="is-family-secondary is-hidden-mobile">Om den här sidan</span>
	</button>

	<slot name="right" />
</div>

<style lang="scss">
	.theater-action-bar {
		z-index: 2;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 0 auto;
		max-width: 1200px;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		height: 48px;
		background-color: var(--channelle-black-background) !important;
		overflow: hidden;

		:global(.spacer) {
			flex-grow: 0.2;
		}

		:global(.button.is-small span) {
			color: rgba(255, 255, 255, 0.6) !important;
		}
		:global(.button.is-small.active span) {
			color: black !important;
		}
		:global(.button.is-small) {
			border-radius: 0;
			border: none;
			padding: 12px;
			background-color: black !important;
			color: white !important;

			&:hover {
				background-color: rgba(255, 255, 255, 0.1) !important;
				transform: translateY(-2px);
			}

			&.active {
				font-weight: 900;
				background-color: white !important;
				color: black !important;
			}
		}
	}

	// Responsive adjustments
	@include mobile {
		.theater-action-bar {
			flex-wrap: wrap;
			height: auto;
			padding: 8px 0;

			.button {
				padding: 8px;
				margin: 2px;
			}
		}
	}
</style>
