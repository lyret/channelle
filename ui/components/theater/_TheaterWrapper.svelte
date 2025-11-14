<script lang="ts">
	import AuthenticationModal from "~/components/modals/TheaterAuthenticationModal.svelte";
	import AboutModal from "~/components/modals/TheaterAboutModal.svelte";
	import CreateShowModal from "~/components/modals/TheaterCreateShowModal.svelte";
	import LaunchersModal from "~/components/modals/LaunchersModal.svelte";

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

	function handleShowCreated() {
		closeCreateShowModal();
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
