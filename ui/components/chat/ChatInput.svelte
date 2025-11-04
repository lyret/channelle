<script lang="ts">
	import { onMount } from "svelte";
	import { sendPublicMessage, sendBackstageMessage, canSendBackstageStore } from "~/api/chat";
	import { peerStore } from "~/api/media";
	import PicolArrowFullLeft from "../picol/icons/Picol-arrow-full-left.svelte";
	import PicolArrowFullUp from "../picol/icons/Picol-arrow-full-up.svelte";

	export let makeBackstage: boolean = false;
	export let isLarge: boolean = false;

	let inputValue: string = "";
	let loading = false;
	let inputRef: HTMLInputElement;

	$: disabled = loading || !inputValue.trim().length;

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();

		// Validate input
		if (!inputValue.trim()) {
			return;
		}

		// Check if user can send backstage messages if trying to
		if (makeBackstage && !$canSendBackstageStore) {
			console.warn("[Chat] User cannot send backstage messages");
			return;
		}

		loading = true;

		try {
			const peerName = $peerStore?.name || "Anonym";

			if (makeBackstage) {
				await sendBackstageMessage(inputValue.trim(), peerName);
			} else {
				await sendPublicMessage(inputValue.trim(), peerName);
			}

			// Clear input on success
			inputValue = "";

			// Refocus input for next message
			if (inputRef && window.innerWidth > 842) {
				inputRef.focus();
			}
		} catch (error) {
			console.error("[Chat] Failed to send message:", error);
			// Keep the input value so user can retry
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (inputRef) {
			const isMobile = window.innerWidth <= 842;
			if (!isMobile) {
				inputRef.focus();
			}
		}
	});

	// Handle Enter key for submission
	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSubmit(new SubmitEvent("submit"));
		}
	}
</script>

<form on:submit={onSubmit} class="form">
	<div class="field has-addons">
		<div class="control is-expanded">
			<input
				type="text"
				autocomplete="off"
				data-1p-ignore
				bind:this={inputRef}
				class="input is-fullwidth"
				class:is-large={isLarge}
				bind:value={inputValue}
				placeholder={makeBackstage ? "Skriv ett backstage-meddelande" : "Skriv ett chattmeddelande"}
				on:keydown={handleKeyDown}
				{disabled}
			/>
		</div>
		<div class="control">
			<button
				type="submit"
				class="button is-dark"
				class:is-large={isLarge}
				{disabled}
				class:is-loading={loading}
				class:is-primary={!loading && !disabled && !makeBackstage}
				class:is-link={!loading && !disabled && makeBackstage}
			>
				{#if disabled && !inputValue.trim()}
					<span class="icon"><PicolArrowFullLeft /></span>
					<span>Skriv något</span>
				{:else if makeBackstage && !$canSendBackstageStore}
					<span class="icon"><PicolArrowFullLeft /></span>
					<span>Ej tillåtet</span>
				{:else if makeBackstage}
					<span class="icon"><PicolArrowFullUp /></span>
					<span>Skicka backstage</span>
				{:else}
					<span class="icon"><PicolArrowFullUp /></span>
					<span>Skicka till alla</span>
				{/if}
			</button>
		</div>
	</div>
</form>
