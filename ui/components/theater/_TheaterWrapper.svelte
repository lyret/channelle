<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import AuthenticationModal from "~/components/modals/TheaterAuthenticationModal.svelte";
	import AboutModal from "~/components/modals/TheaterAboutModal.svelte";
	import CreateShowModal from "~/components/modals/TheaterCreateShowModal.svelte";
	import LaunchersModal from "~/components/modals/LaunchersModal.svelte";
	import { fetchShows, initializeConfigAPI } from "~/api/config";
	import {
		showAuthModal,
		showAboutModal,
		showCreateShowModal,
		showLauncherModal,
		closeAuthModal,
		closeAboutModal,
		closeCreateShowModal,
		closeLauncherModal,
	} from "~/stores/theaterModals";

	let refreshInterval: number;

	onMount(async () => {
		// Initialize the show API
		await initializeConfigAPI();

		// Set up periodic refresh for real-time status updates (every 5 seconds)
		refreshInterval = setInterval(() => {
			fetchShows();
		}, 5000);
	});

	onDestroy(() => {
		// Clean up interval on component destroy
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	// Modal event handlers
	function handleAuthenticated() {
		closeAuthModal();
	}

	function handleAuthCancel() {
		closeAuthModal();
	}

	function handleAboutClose() {
		closeAboutModal();
	}

	function handleShowCreated(event: CustomEvent<{ id: number; name: string }>) {
		closeCreateShowModal();
		console.log(`Show created: ${event.detail.name} (ID: ${event.detail.id})`);
		// Refresh the shows list
		fetchShows();
	}

	function handleCreateShowCancel() {
		closeCreateShowModal();
	}

	function handleLauncherClose() {
		closeLauncherModal();
	}
</script>

<main>
	<!-- Page content slot -->
	<slot />

	<!-- Modals managed centrally -->
	<AuthenticationModal isVisible={$showAuthModal} on:authenticated={handleAuthenticated} on:cancel={handleAuthCancel} />

	<AboutModal isVisible={$showAboutModal} on:close={handleAboutClose} />

	<CreateShowModal isVisible={$showCreateShowModal} on:created={handleShowCreated} on:cancel={handleCreateShowCancel} />

	<LaunchersModal isVisible={$showLauncherModal} on:close={handleLauncherClose} />
</main>

<style lang="scss">
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
