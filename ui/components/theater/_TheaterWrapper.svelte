<script lang="ts">
	import { onMount } from "svelte";
	import AuthenticationModal from "~/components/modals/TheaterAuthenticationModal.svelte";
	import AboutModal from "~/components/modals/TheaterAboutModal.svelte";
	import CreateShowModal from "~/components/modals/TheaterCreateShowModal.svelte";
	import { fetchShows, initializeConfigAPI } from "~/api/config";
	import {
		showAuthModal,
		showAboutModal,
		showCreateShowModal,
		closeAuthModal,
		closeAboutModal,
		closeCreateShowModal,
	} from "~/stores/theaterModals";

	onMount(async () => {
		// Initialize the show API
		await initializeConfigAPI();
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
</script>

<main>
	<!-- Page content slot -->
	<slot />

	<!-- Modals managed centrally -->
	<AuthenticationModal isVisible={$showAuthModal} on:authenticated={handleAuthenticated} on:cancel={handleAuthCancel} />

	<AboutModal isVisible={$showAboutModal} on:close={handleAboutClose} />

	<CreateShowModal isVisible={$showCreateShowModal} on:created={handleShowCreated} on:cancel={handleCreateShowCancel} />
</main>

<style lang="scss">
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
