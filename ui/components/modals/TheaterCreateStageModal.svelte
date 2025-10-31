<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import Modal from "./_Modal.svelte";
	import { createStage, stageCreationError, isCreatingStage, clearStageCreationError } from "~/stores/stageCreation";

	const dispatch = createEventDispatcher<{
		created: { id: number; name: string };
		cancel: void;
	}>();

	export let isVisible = false;

	let stageName = "";

	async function submitCreateStage() {
		const result = await createStage(stageName);
		if (result) {
			stageName = "";
			dispatch("created", result);
		}
	}

	function handleCancel() {
		stageName = "";
		clearStageCreationError();
		dispatch("cancel");
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter") {
			submitCreateStage();
		}
	}
</script>

<Modal {isVisible} title="Skapa en ny föreställning" size="small" on:close={handleCancel}>
	<div class="field">
		<label class="label" for="stage-name">Namn på föreställningen</label>
		<div class="control">
			<input
				id="stage-name"
				class="input"
				class:is-danger={$stageCreationError}
				type="text"
				bind:value={stageName}
				on:keydown={handleKeydown}
				placeholder="Ange ett namn"
				disabled={$isCreatingStage}
			/>
		</div>
		{#if $stageCreationError}
			<p class="help is-danger">{$stageCreationError}</p>
		{/if}
	</div>

	<svelte:fragment slot="footer">
		<button class="button is-success" class:is-loading={$isCreatingStage} on:click={submitCreateStage} disabled={$isCreatingStage || !stageName.trim()}>
			Skapa
		</button>
		<button class="button" on:click={handleCancel} disabled={$isCreatingStage}> Avbryt </button>
	</svelte:fragment>
</Modal>

<style lang="scss">
	.help {
		margin-top: 0.5rem;
	}
</style>
