<script lang="ts">
	import { onMount } from "svelte";
	import { configManager, currentShowStore } from "~/api/config";
	import { currentModeStore, AppMode } from "~/api/config";
	import IconSave from "../icons/Icon-save.svelte";
	import IconX from "../icons/Icon-x.svelte";

	let nameInput = "";
	let descriptionInput = "";
	let nomenclatureInput = "";
	let originalName = "";
	let originalDescription = "";
	let originalNomenclature = "";
	let isLoading = false;
	let errorMessage = "";
	let success = false;

	$: nameCharCount = nameInput.length;
	$: descriptionCharCount = descriptionInput.length;
	$: nomenclatureCharCount = nomenclatureInput.length;
	const nameMaxLength = 255;
	const descriptionMaxLength = 1000;
	const nomenclatureMaxLength = 100;

	$: isTheaterMode = $currentModeStore === AppMode.THEATER;
	$: canEdit = isTheaterMode && configManager.canUpdateConfig();
	$: hasChanges = nameInput !== originalName || descriptionInput !== originalDescription || nomenclatureInput !== originalNomenclature;
	$: canSave = hasChanges && nameInput.trim().length > 0 && !isLoading;

	let isInitialized = false;

	onMount(() => {
		// Subscribe to current show changes
		const unsubscribe = currentShowStore.subscribe((show) => {
			if (show) {
				const newOriginalName = show.name || "";
				const newOriginalDescription = show.description || "";
				const newOriginalNomenclature = show.nomenclature || "föreställningen";

				// Only update if this is the initial load or if the values actually changed from outside
				if (
					!isInitialized ||
					(originalName !== newOriginalName && nameInput === originalName) ||
					(originalDescription !== newOriginalDescription && descriptionInput === originalDescription) ||
					(originalNomenclature !== newOriginalNomenclature && nomenclatureInput === originalNomenclature)
				) {
					originalName = newOriginalName;
					originalDescription = newOriginalDescription;
					originalNomenclature = newOriginalNomenclature;
					nameInput = originalName;
					descriptionInput = originalDescription;
					nomenclatureInput = originalNomenclature;
					isInitialized = true;
				}
			}
		});

		return unsubscribe;
	});

	// Sets the displayed error message and clears after 8 seconds
	function setError(message: string) {
		errorMessage = message;
		setTimeout(() => {
			errorMessage = "";
		}, 8000);
	}

	function resetForm() {
		errorMessage = "";
		success = false;
		// Reset to original values
		nameInput = originalName;
		descriptionInput = originalDescription;
		nomenclatureInput = originalNomenclature;
	}

	async function saveChanges() {
		if (!canSave) return;

		isLoading = true;
		errorMessage = "";
		success = false;

		try {
			// Only include fields that have actually changed
			const metadata: { name?: string; description?: string; nomenclature?: string } = {};

			if (nameInput.trim() !== originalName) {
				metadata.name = nameInput.trim();
			}
			if (descriptionInput.trim() !== originalDescription) {
				metadata.description = descriptionInput.trim();
			}
			if (nomenclatureInput.trim() !== originalNomenclature) {
				metadata.nomenclature = nomenclatureInput.trim();
			}

			// Check if we actually have changes to send
			if (Object.keys(metadata).length === 0) {
				setError("No changes detected");
				return;
			}

			const result = await configManager.updateMetadata(metadata);

			if (result.success) {
				// Update only the original values for fields that were actually sent
				if (metadata.name !== undefined) {
					originalName = metadata.name;
				}
				if (metadata.description !== undefined) {
					originalDescription = metadata.description;
				}
				if (metadata.nomenclature !== undefined) {
					originalNomenclature = metadata.nomenclature;
				}

				success = true;

				// Clear success message after 3 seconds
				setTimeout(() => {
					success = false;
				}, 3000);
			} else {
				setError(result.error || "Okänt fel");
			}
		} catch (error) {
			console.error("Saving metadata failed:", error);
			setError("Ett oväntat fel uppstod. Försök igen.");
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" && !event.shiftKey && canSave) {
			event.preventDefault();
			saveChanges();
		} else if (event.key === "Escape") {
			resetForm();
		}
	}
</script>

<div class="show-metadata-instrument">
	<h1 class="title">Föreställningsinfo</h1>

	{#if !isTheaterMode}
		<div class="notification is-info is-light">
			<p class="is-size-7">
				<strong>Skrivskyddad vy</strong><br />
				Föreställningsinfo kan endast redigeras i förberedelsesläge (theater mode).
			</p>
		</div>
	{/if}

	{#if success}
		<div class="notification is-success">
			<p>✓ Föreställningsinfo har uppdaterats</p>
		</div>
	{/if}

	{#if errorMessage}
		<div class="notification is-danger is-light">
			<p class="has-text-danger">✗ {errorMessage}</p>
		</div>
	{/if}

	<div class="metadata-content">
		<div class="field">
			<label class="label" for="show-name">Namn</label>
			<div class="control">
				<input
					id="show-name"
					class="input"
					class:is-danger={!nameInput.trim()}
					class:is-warning={nameCharCount > nameMaxLength * 0.9}
					type="text"
					bind:value={nameInput}
					on:keydown={handleKeydown}
					placeholder="Ange föreställningsnamn"
					disabled={isLoading || !canEdit}
					maxlength={nameMaxLength}
				/>
			</div>
			<div class="help-section">
				{#if !nameInput.trim()}
					<p class="help is-danger">Namn är obligatoriskt</p>
				{/if}
				<p class="help character-count" class:is-warning={nameCharCount > nameMaxLength * 0.9}>
					{nameCharCount}/{nameMaxLength} tecken
				</p>
			</div>
		</div>

		<div class="field">
			<label class="label" for="show-nomenclature">Nomenklatur</label>
			<div class="control">
				<input
					id="show-nomenclature"
					class="input"
					class:is-warning={nomenclatureCharCount > nomenclatureMaxLength * 0.9}
					type="text"
					bind:value={nomenclatureInput}
					on:keydown={handleKeydown}
					placeholder="t.ex. föreställningen, föreläsningen, grejen"
					disabled={isLoading || !canEdit}
					maxlength={nomenclatureMaxLength}
					list="nomenclature-suggestions"
				/>
				<datalist id="nomenclature-suggestions">
					<option value="föreställningen">föreställningen</option>
					<option value="föreläsningen">föreläsningen</option>
					<option value="grejen">grejen</option>
					<option value="evenemanget">evenemanget</option>
					<option value="programmet">programmet</option>
				</datalist>
			</div>
			<div class="help-section">
				<p class="help">Exempelvis, klicka här för att ansluta till {nomenclatureInput} "{nameInput}"</p>
				<p class="help character-count" class:is-warning={nomenclatureCharCount > nomenclatureMaxLength * 0.9}>
					{nomenclatureCharCount}/{nomenclatureMaxLength} tecken
				</p>
			</div>
		</div>

		<div class="field">
			<label class="label" for="show-description">Beskrivning</label>
			<div class="control">
				<textarea
					id="show-description"
					class="textarea"
					class:is-warning={descriptionCharCount > descriptionMaxLength * 0.9}
					bind:value={descriptionInput}
					on:keydown={handleKeydown}
					placeholder="Ange en beskrivning av föreställningen (valfritt)"
					disabled={isLoading || !canEdit}
					rows="4"
					maxlength={descriptionMaxLength}
				/>
			</div>
			<div class="help-section">
				<p class="help">{canEdit ? "" : "Skrivskyddad i sceneläge"}</p>
				<p class="help character-count" class:is-warning={descriptionCharCount > descriptionMaxLength * 0.9}>
					{descriptionCharCount}/{descriptionMaxLength} tecken
				</p>
			</div>
		</div>

		{#if canEdit}
			<div class="field is-grouped">
				<div class="control">
					<button class="button is-success" class:is-loading={isLoading} disabled={!canSave} on:click={saveChanges}>
						<span class="icon">
							<IconSave />
						</span>
						<span>Spara</span>
					</button>
				</div>
				<div class="control">
					<button class="button" disabled={!hasChanges || isLoading} on:click={resetForm}>
						<span class="icon">
							<IconX />
						</span>
						<span>Återställ</span>
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.show-metadata-instrument {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.metadata-content {
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

		.character-count {
			font-size: 0.675rem;
			opacity: 0.8;
			text-align: right;
			flex-shrink: 0;
		}
	}

	.textarea {
		resize: vertical;
		min-height: 100px;
	}

	.is-grouped {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;

		.control {
			margin-right: 0;
		}
	}

	// Responsive adjustments
	@media screen and (max-width: 768px) {
		.is-grouped {
			flex-direction: column;

			.control {
				width: 100%;

				.button {
					width: 100%;
				}
			}
		}
	}
</style>
