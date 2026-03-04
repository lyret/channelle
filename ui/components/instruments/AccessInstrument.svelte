<script lang="ts">
	import { onMount } from "svelte";
	import IconLock from "../icons/Icon-lock.svelte";
	import IconUnlock from "../icons/Icon-unlock.svelte";
	import IconCopy from "../icons/Icon-copy.svelte";
	import { showPasswordStore, showMetadataStore, showIdStore, updateConfigurationSettings } from "~/api/backstage";
	import { generateUrlSlug } from "~/utils/serverSideUtils";

	let inputRef: HTMLInputElement;
	let inputValue: string = "";

	let isLoading = false;
	let errorMessage: string = "";
	let successMessage: string = "";
	let originalPassword = "";
	let copyStageAddressMessage: string = "";
	let copyBackstageAddressMessage: string = "";

	$: isLocked = $showPasswordStore?.length;
	$: isChanged = originalPassword !== inputValue;
	$: canSave = isChanged && !isLoading;
	$: isChangingPassword = isChanged && inputValue.trim().length > 0;
	$: isRemovingPassword = isChanged && inputValue.trim().length === 0 && isLocked;
	$: showPath = generateUrlSlug({ name: $showMetadataStore?.name, id: $showIdStore }) || window.location.pathname;

	// Sets the displayed error message and clears after 8 seconds
	function setError(message: string) {
		errorMessage = message;
		setTimeout(() => {
			errorMessage = "";
		}, 8000);
	}

	async function copyToClipboardForStage(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copyStageAddressMessage = "Kopierade adressen";
			setTimeout(() => {
				copyStageAddressMessage = "";
			}, 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
			copyStageAddressMessage = "Kunde inte kopiera";
			setTimeout(() => {
				copyStageAddressMessage = "";
			}, 2000);
		}
	}

	async function copyToClipboardForBackstage(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copyBackstageAddressMessage = "Kopierade adressen för tekniker";
			setTimeout(() => {
				copyBackstageAddressMessage = "";
			}, 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
			copyBackstageAddressMessage = "Kunde inte kopiera";
			setTimeout(() => {
				copyBackstageAddressMessage = "";
			}, 2000);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" && canSave) {
			event.preventDefault();
			submitPasswordChange();
		}
	}

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		await submitPasswordChange();
	}

	async function onButtonClick() {
		await submitPasswordChange();
	}

	async function submitPasswordChange() {
		if (!canSave) return;

		isLoading = true;
		errorMessage = "";
		successMessage = "";

		try {
			// Use config manager to handle both theater and stage modes
			const result = await updateConfigurationSettings({ password: inputValue });

			if (result.success) {
				// Update original password to reflect new state
				originalPassword = inputValue || "";

				if (inputValue) {
					successMessage = isLocked ? "Lösenordet har ändrats" : "Lösenordet har aktiverats";
				} else {
					successMessage = "Lösenordet har tagits bort";
				}
				// Clear success message after 3 seconds
				setTimeout(() => {
					successMessage = "";
				}, 3000);
			} else {
				setError(result.error || "Okänt fel");
			}
		} catch (error: any) {
			console.error("Failed to update password:", error);
			setError("Ett oväntat fel uppstod. Försök igen.");
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		// Subscribe to password store - this will fire immediately with current value
		const unsubscribePassword = showPasswordStore.subscribe((storeValue) => {
			// Handle both undefined (not loaded) and string (loaded) values
			const newValue = storeValue !== undefined ? storeValue || "" : "";
			inputValue = newValue;
			originalPassword = newValue;
		});

		return () => {
			unsubscribePassword();
		};
	});
</script>

<div class="access-instrument">
	<h1 class="title">Tillgång</h1>
	<div class="access-content">
		<div class="field">
			<label class="label">Scen-URL</label>
			<div class="control">
				<div class="input-with-copy">
					<input class="input" type="text" value={`${CONFIG.ipc.theaterServerUrl}/f/${showPath}`} readonly />
					<button
						class="button is-small copy-button"
						on:click={() => copyToClipboardForStage(`${CONFIG.ipc.theaterServerUrl}/f/${showPath}`)}
						title="Kopiera till urklipp"
					>
						<span class="icon is-small">
							<IconCopy />
						</span>
						{#if copyStageAddressMessage}
							<span class="copy-success">{copyStageAddressMessage}</span>
						{/if}
					</button>
				</div>
			</div>
			<div class="help-section">
				<p class="help">
					Använd denna adress för att bjuda in publiken till {$showMetadataStore.nomenclature}. (kom ihåg att aktivera scenen först!)
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">Backstage</label>
			<div class="control">
				<div class="input-with-copy">
					<input class="input" type="text" value={`${CONFIG.ipc.theaterServerUrl}/f/${showPath}/backstage`} readonly />
					<button
						class="button is-small copy-button"
						on:click={() => copyToClipboardForBackstage(`${CONFIG.ipc.theaterServerUrl}/f/${showPath}/backstage`)}
						title="Kopiera till urklipp"
					>
						<span class="icon is-small">
							<IconCopy />
						</span>
						{#if copyBackstageAddressMessage}
							<span class="copy-success">{copyBackstageAddressMessage}</span>
						{/if}
					</button>
				</div>
			</div>
			<div class="help-section">
				<p class="help">
					Använd denna adress för att bjuda in tekniker till att administrera {$showMetadataStore.name}<br /><br />
					<strong class="has-text-white"
						>Båda dessa sökvägar genereras automatiskt från föreställningens namn och gäller inte längre om du ändrar namn!</strong
					>
				</p>
			</div>
		</div>

		<form on:submit={onSubmit}>
			<div class="field">
				<label class="label" for="stage-password">Scenlösenord</label>
				<div class="control">
					<input
						id="stage-password"
						type="text"
						autocomplete="off"
						data-1p-ignore
						bind:this={inputRef}
						class="input"
						class:is-secondary={isLocked && !isChanged && !errorMessage}
						class:is-warning={isChanged}
						class:is-danger={errorMessage}
						bind:value={inputValue}
						on:keydown={handleKeydown}
						placeholder={isLocked ? "Ange nytt lösenord eller lämna tomt för att ta bort" : "Ange ett lösenord för att låsa scenen"}
					/>
				</div>
				<div class="help-section">
					{#if errorMessage}
						<p class="help is-danger">{errorMessage}</p>
					{:else if successMessage}
						<p class="help is-success">{successMessage}</p>
					{:else}
						<p class="help">
							{#if isRemovingPassword}
								Tryck Enter för att ta bort lösenordet
							{:else if isChangingPassword}
								Tryck Enter för att {isLocked ? "byta" : "aktivera"} lösenord
							{:else if isLocked}
								Scenen är lösenordsskyddad
							{:else}
								Scenen är öppen för alla
							{/if}
						</p>
					{/if}
				</div>
			</div>
		</form>

		<div class="field">
			<div class="control">
				<button
					type="button"
					class="button"
					class:is-success={!isLocked && !isChanged && !errorMessage}
					class:has-text-warning={!isChangingPassword && isLocked}
					class:is-warning={isChangingPassword && !errorMessage}
					class:is-danger={isRemovingPassword || errorMessage}
					class:is-loading={isLoading}
					disabled={!canSave}
					on:click={onButtonClick}
				>
					<span class="icon">
						{#if isLocked}
							{#if isChanged && inputValue.length}
								<IconLock />
							{:else if isChanged}
								<IconUnlock />
							{:else}
								<IconLock />
							{/if}
						{:else if isChanged}
							<IconLock />
						{:else}
							<IconUnlock />
						{/if}
					</span>
					<span>
						{#if isRemovingPassword}
							Ta bort lösenord
						{:else if isChangingPassword}
							{isLocked ? "Uppdatera lösenordet" : "Aktivera lösenordet"}
						{:else if isLocked}
							Lösenord aktivt
						{:else}
							Inget lösenord
						{/if}
					</span>
				</button>
			</div>
		</div>

		{#if isChangingPassword}
			<div class="notification is-info is-light">
				<p class="is-size-7">Om du ändrar lösenordet måste alla deltagare ange det på nytt för att få tillgång.</p>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.access-instrument {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.access-content {
		flex: 1;
		overflow-y: auto;
	}

	.field {
		margin-bottom: 1.5rem;
	}

	.label {
		font-weight: 600;
		color: var(--bulma-text-strong);
	}

	.notification {
		margin-bottom: 1rem;

		p {
			margin-bottom: 0;
		}
	}

	.help {
		margin-top: 0.25rem;
		font-size: 0.75rem;
	}

	.help-section {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
		flex-wrap: wrap;
		gap: 0.5rem;

		.help {
			margin-top: 0;
		}
	}

	// Responsive adjustments
	@media screen and (max-width: 768px) {
		.control {
			.button {
				width: 100%;
			}
		}
	}
</style>
