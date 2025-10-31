<script lang="ts">
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	export let isVisible = false;
	export let title = "";
	export let size: "small" | "medium" | "large" = "medium";
	export let showCloseButton = true;
	export let closeOnBackgroundClick = true;
	export let closeOnEscape = true;

	function handleClose() {
		dispatch("close");
	}

	function handleBackgroundClick() {
		if (closeOnBackgroundClick) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (closeOnEscape && event.key === "Escape") {
			handleClose();
		}
	}

	$: sizeClass = {
		small: "modal-card-small",
		medium: "",
		large: "modal-card-large"
	}[size];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
	<div class="modal is-active">
		<div
			class="modal-background"
			on:click={handleBackgroundClick}
			role="button"
			tabindex="0"
			on:keydown={(e) => e.key === "Enter" && handleBackgroundClick()}
		></div>
		<div class="modal-card {sizeClass}">
			{#if title}
				<header class="modal-card-head">
					<p class="modal-card-title">{title}</p>
					{#if showCloseButton}
						<button class="delete" aria-label="close" on:click={handleClose}></button>
					{/if}
				</header>
			{/if}
			<section class="modal-card-body">
				<slot />
			</section>
			<footer class="modal-card-foot">
				<slot name="footer" />
			</footer>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-card {
		max-width: 500px;
		margin: 0 auto;

		&.modal-card-small {
			max-width: 400px;
		}

		&.modal-card-large {
			max-width: 700px;
		}
	}
</style>
