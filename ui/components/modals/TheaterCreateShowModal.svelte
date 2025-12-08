<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";
	import { createShowLocal, showCreationError, isCreatingShow, clearShowCreationError } from "~/stores/theater/showCreation";

	const dispatch = createEventDispatcher<{
		created: { id: number; name: string };
		cancel: void;
	}>();

	export let isVisible = false;

	let showName = "";

	async function submitCreateShow() {
		const result = await createShowLocal(showName);
		if (result) {
			showName = "";
			dispatch("created", result);
		}
	}

	function handleCancel() {
		showName = "";
		clearShowCreationError();
		dispatch("cancel");
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			submitCreateShow();
		}
	}
</script>

<Modal {isVisible} title="Skapa en ny föreställning" size="small" on:close={handleCancel}>
	<div class="field">
		<label class="label" for="show-name">Namn på föreställningen</label>
		<div class="control">
			<input
				id="show-name"
				class="input"
				class:is-danger={$showCreationError}
				type="text"
				bind:value={showName}
				on:keydown={handleKeydown}
				placeholder="Ange ett namn"
				disabled={$isCreatingShow}
			/>
		</div>
		{#if $showCreationError}
			<p class="help is-danger">{$showCreationError}</p>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<button class="button is-success" class:is-loading={$isCreatingShow} on:click={submitCreateShow} disabled={$isCreatingShow || !showName.trim()}>
			Skapa
		</button>
		<button class="button" on:click={handleCancel} disabled={$isCreatingShow}> Avbryt </button>
	</svelte:fragment>
</Modal>

<style lang="scss">
	.help {
		margin-top: 0.5rem;
	}
</style>
