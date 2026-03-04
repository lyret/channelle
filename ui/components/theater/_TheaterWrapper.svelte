<script lang="ts">
	import AuthenticationModal from "~/components/modals/TheaterAuthenticationModal.svelte";
	import AboutModal from "~/components/modals/TheaterAboutModal.svelte";
	import CreateShowModal from "~/components/modals/TheaterCreateShowModal.svelte";
	import RemoteServerModal from "~/components/modals/RemoteServerModal.svelte";
	import TheaterHistoryModal from "~/components/modals/TheaterHistoryModal.svelte";

	import {
		showAuthModal,
		showAboutModal,
		showCreateShowModal,
		showRemoteServerModal,
		showHistoryModal,
		closeAuthModal,
		closeAboutModal,
		closeCreateShowModal,
		closeRemoteServerModal,
		closeHistoryModal,
	} from "~/stores/theater/theaterModals";

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

	function handleRemoteServerModalClose() {
		closeRemoteServerModal();
	}

	function handleHistoryModalClose() {
		closeHistoryModal();
	}
</script>

<main>
	<!-- Page content slot -->
	<slot />

	<!-- Modals managed centrally -->
	<AuthenticationModal isVisible={$showAuthModal} on:authenticated={handleAuthenticated} on:cancel={handleAuthCancel} />

	<AboutModal isVisible={$showAboutModal} on:close={handleAboutClose} />

	<CreateShowModal isVisible={$showCreateShowModal} on:created={handleShowCreated} on:cancel={handleCreateShowCancel} />

	<RemoteServerModal isVisible={$showRemoteServerModal} on:close={handleRemoteServerModalClose} />

	<TheaterHistoryModal isVisible={$showHistoryModal} on:close={handleHistoryModalClose} />
</main>

<style lang="scss">
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
