<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import { blur } from "svelte/transition";
	import IconUser from "~/components/picol/icons/Picol-user-close.svelte";
	import IconPlus from "~/components/picol/icons/Picol-plus.svelte";
	import IconInfo from "~/components/picol/icons/Picol-book-sans-information.svelte";

	export let isSignedIn = false;


	function handleSignIn() {
		// TODO: Implement sign in functionality
		isSignedIn = !isSignedIn;
		console.log("Sign in clicked:", isSignedIn ? "signed in" : "signed out");
	}

	function handleCreateStage() {
		showCreateStageModal = true;
	}

	async function submitCreateStage() {
		if (!newStageName.trim()) {
			alert("Stage name is required");
			return;
		}

		const stageData: CreateStageData = {
			name: newStageName.trim(),
			description: newStageDescription.trim(),
			stagePassword: newStagePassword.trim(),
		};

		const result = await createStage(stageData);

		if (result) {
			// Reset form and close modal
			newStageName = "";
			newStageDescription = "";
			newStagePassword = "";
			showCreateStageModal = false;
			alert(`Stage "${result.name}" created successfully!`);
		} else {
			// Error is already handled by the store
			alert("Failed to create stage. Please try again.");
		}
	}

	function cancelCreateStage() {
		newStageName = "";
		newStageDescription = "";
		newStagePassword = "";
		showCreateStageModal = false;
	}

	function handleJoinStage() {
		// TODO: Implement join stage functionality
		alert("Join stage - functionality coming soon!");
	}

	function handleSettings() {
		// TODO: Implement settings functionality
		alert("Settings - functionality coming soon!");
	}

	function handleAbout() {
		// TODO: Implement about/info functionality
		alert("About Channelle Theater - functionality coming soon!");
	}


	// Action bar styling classes matching ActionBar component
	const btnClassList = "button is-small";
	const iconClassList = "icon is-size-4";
</script>

<div>
	<div class="theater-action-bar">
		<!-- Sign In / User Status -->
		<button
			class={btnClassList}
			class:active={isSignedIn}
			on:click={() => dispatch('signIn')}
		>
			<span class={iconClassList}>
				<IconUser />
			</span>
			<span class="is-family-secondary">
				{isSignedIn ? "Sign Out" : "Logga in"}
			</span>
		</button>

		<!-- Spacer -->
		<div class="spacer" />

		<!-- Create New Stage -->
		{#if isSignedIn}
		<button
			class={btnClassList}
			on:click={() => dispatch('createStage')}
		>
			<span class={iconClassList}>
				<IconPlus />
			</span>
			<span class="is-family-secondary">Skapa en ny server</span>
		</button>
		{/if}

		<!-- Spacer -->
		<div class="spacer" />

		<!-- About -->
		<button
			class={btnClassList}
			on:click={() => dispatch('about')}
			transition:blur
		>
			<span class={iconClassList}>
				<IconInfo />
			</span>
			<span class="is-family-secondary is-hidden-mobile">Om den här sidan</span>
		</button>
	</div>
</div>

<style lang="scss">
	.theater-action-bar {
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		height: 48px;
		background-color: var(--channelle-menu-bg-color);
		overflow: hidden;

		.spacer {
			flex-grow: 0.2;
		}

		.button {
			border-radius: 0;
			border: none;
			padding: 12px;
			background-color: var(--channelle-menu-bg-color);
			color: var(--channelle-menu-text-color);


			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
				transform: translateY(-1px);
			}

			&.active {
				font-weight: 900;
				background-color: var(--channelle-menu-text-color);
				color: var(--channelle-menu-bg-color);
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
