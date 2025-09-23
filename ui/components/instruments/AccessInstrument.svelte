<script lang="ts">
	import { onMount } from "svelte";
	import IconLock from "../icons/Icon-lock.svelte";
	import IconUnlock from "../icons/Icon-unlock.svelte";
	import { stagePasswordStore } from "~/api/room";

	let inputRef: HTMLInputElement;
	let inputValue: string = "";

	let isLoading = false;
	$: isLocked = $stagePasswordStore?.length;
	$: isChanged = $stagePasswordStore != inputValue;
	$: disabled = isLoading || !isChanged;

	const inviteLinks = ["", ""];

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		isLoading = true;

		setTimeout(() => {
			isLoading = false;
			// FIXME: re-add ability to lock the screen scenePassword.set(inputValue);
		}, 1500);
	}

	onMount(() => {
		if (inputRef) {
			inputRef.focus();
		}
		const stop = stagePasswordStore.subscribe((value) => {
			inputValue = value || "";
		});

		const currentUrl = new URL(window.location.href);
		const searchParams = new URLSearchParams("invite=" + CONFIG.stage.inviteKey);
		inviteLinks[0] = `${currentUrl.origin}?${searchParams.toString()}`;
		inviteLinks[1] = `${currentUrl.origin}/backstage?${searchParams.toString()}`;

		return () => {
			stop();
		};
	});
</script>

<h1 class="title mb-0">Tillgång</h1>
<p>Kontrollera vilka som har tillgång till scenen</p>
<h3 class="title is-4 mt-1 mb-4">Länk för skådespelare</h3>
<p>Du kan dela denna länk för att få dem som följer dem att omedelbart få tillgång som skådespelare.</p>
<h4 class="title is-6 mt-0 mb-4">{inviteLinks[0]}</h4>

<h3 class="title is-4 mt-4 mb-0">Scenlösenord</h3>
<p>Ange ett lösenord som krävs för att komma in och se scenen.</p>
<form on:submit={onSubmit} class="form my-2">
	<div class="field has-addons">
		<div class="control is-expanded">
			<input
				type="text"
				autocomplete="off"
				data-1p-ignore
				bind:this={inputRef}
				class="input is-fullwidth is-medium"
				bind:value={inputValue}
				placeholder={isLocked ? "Spara för att ta bort lösenordet" : "Ange ett lösenord"}
			/>
		</div>
		<div class="control">
			<button
				type="submit"
				class="button is-dark is-medium"
				{disabled}
				class:is-loading={isLoading}
				class:is-danger={isLocked && !isChanged && !isLoading}
				class:is-warning={isChanged || isLoading}
			>
				{#if isLocked}
					{#if isChanged && inputValue.length}
						<span class="icon"><IconLock /></span><span>Byt lösenord</span>
					{:else if isChanged}
						<span class="icon"><IconUnlock /></span><span>Lås upp</span>
					{:else}
						<span class="icon"><IconLock /></span><span>Scenen är låst</span>
					{/if}
				{:else if isChanged}
					<span class="icon"><IconLock /></span><span>Lås nu</span>
				{:else}
					<span class="icon"><IconUnlock /></span><span>Scenen är olåst</span>
				{/if}
			</button>
		</div>
	</div>
</form>
<p>Om du ändrar lösenordet måste alla ange det på nytt.</p>
