<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";
	import { authenticateTheater, authError, isAuthenticating, clearAuthError } from "~/stores/theaterAuth";

	const dispatch = createEventDispatcher<{
		authenticated: void;
		cancel: void;
	}>();

	export let isVisible = false;

	let authPassword = "";

	async function submitAuthentication() {
		const success = await authenticateTheater(authPassword);
		if (success) {
			authPassword = "";
			dispatch("authenticated");
		}
	}

	function handleCancel() {
		authPassword = "";
		clearAuthError();
		dispatch("cancel");
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			submitAuthentication();
		}
	}
</script>

<Modal {isVisible} title="Logga in" size="small" on:close={handleCancel}>
	<div class="field">
		<label class="label" for="auth-password">Ange lösenordet för att hantera föreställningar</label>
		<div class="control">
			<input
				id="auth-password"
				class="input"
				class:is-danger={$authError}
				type="password"
				bind:value={authPassword}
				on:keydown={handleKeydown}
				placeholder="..."
				disabled={$isAuthenticating}
			/>
		</div>
		{#if $authError}
			<p class="help is-danger">{$authError}</p>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<button class="button is-success" class:is-loading={$isAuthenticating} on:click={submitAuthentication} disabled={$isAuthenticating}> Skicka </button>
		<button class="button" on:click={handleCancel} disabled={$isAuthenticating}> Avbryt </button>
	</svelte:fragment>
</Modal>
