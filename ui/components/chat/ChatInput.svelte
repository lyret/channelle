<script lang="ts">
	import { onMount } from "svelte";
	import { create } from "~/lib";
	import { APIStore } from "~/lib/stores/api";
	import PicolArrowFullLeft from "../picol/icons/Picol-arrow-full-left.svelte";
	import PicolArrowFullUp from "../picol/icons/Picol-arrow-full-up.svelte";
	export let makeBackstage: boolean = false;
	export let isLarge: boolean = false;
	let inputValue: string = "";
	let loading = false;
	$: disabled = loading || !inputValue.length;

	let inputRef: HTMLInputElement;

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		if ($APIStore.status == "ready") {
			await create("message", {
				data: {
					participantId: $APIStore.participantId,
					backstage: makeBackstage,
					message: inputValue,
				},
			});
		}

		loading = false;
		inputValue = "";
	}

	onMount(() => {
		if (inputRef) {
			const isMobile = window.innerWidth <= 842;
			if (!isMobile) {
				inputRef.focus();
			}
		}
	});
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
				placeholder="Skriv ett chattmeddelande"
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
				{#if disabled}
					<span class="icon"><PicolArrowFullLeft /></span><span
						>Skriv något</span
					>
				{:else if makeBackstage}
					<span class="icon"><PicolArrowFullUp /></span><span
						>Skicka till backstage</span
					>
				{:else}
					<span class="icon"><PicolArrowFullUp /></span><span
						>Skicka till alla</span
					>
				{/if}
			</button>
		</div>
	</div>
</form>
