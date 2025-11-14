<script lang="ts">
	import { setSetting, showSceneOverridesStores, resetSettings } from "~/api/shows";
	import PicolBrightnessDarken from "../picol/icons/Picol-brightness-darken.svelte";

	export let errorMessage: string = "";
	export let isLoading: boolean = false;
	export let handleApiCall: (apiCall: Promise<{ success: boolean; error?: string }>) => Promise<void>;

	// Check if any override settings are not automatic
	$: hasActiveOverrides =
		$showSceneOverridesStores.curtains !== 0 ||
		$showSceneOverridesStores.chatEnabled !== 0 ||
		$showSceneOverridesStores.visitorVideoEnabled !== 0 ||
		$showSceneOverridesStores.visitorAudioEnabled !== 0 ||
		$showSceneOverridesStores.gratitudeEffectsEnabled !== 0 ||
		$showSceneOverridesStores.criticalEffectsEnabled !== 0;

	// Reset all override settings to automatic
	async function resetOverrides() {
		await handleApiCall(resetSettings(true)); // persist to show
	}
</script>

<p>Dessa inställningar åsidosätter alltid de inställningar som finns i den aktiva scenen.</p>
<p>Använd "Automatiskt" för att låta varje scen bestämma sina egna inställningar.</p>

<div class="field mt-2">
	<label class="label">Visa ridån 🎭</label>
	<div class="control">
		<div class="buttons has-addons">
			<button
				class="button"
				class:is-dark={$showSceneOverridesStores.curtains !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("curtains", 0, true))}
			>
				Automatiskt
			</button>
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStores.curtains !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("curtains", 2, true))}
			>
				Dölj
			</button>
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStores.curtains !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("curtains", 1, true))}
			>
				Visa
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStores.curtains === 0}
				Visas automatiskt enligt vald scen
			{:else if $showSceneOverridesStores.curtains === 1}
				<b>Ridån visas</b>
			{:else}
				<b>Ridån är dold</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<label class="label">Visa chatt-panelen 💬</label>
	<div class="control">
		<div class="buttons has-addons">
			<button
				class="button"
				class:is-dark={$showSceneOverridesStores.chatEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("chatEnabled", 0, true))}
			>
				Automatiskt
			</button>
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStores.chatEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("chatEnabled", 2, true))}
			>
				Dölj
			</button>
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStores.chatEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("chatEnabled", 1, true))}
			>
				Visa
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStores.chatEnabled === 0}
				Chatten visas beroende på vald scen
			{:else if $showSceneOverridesStores.chatEnabled === 1}
				<b>Chatten är aktiverad</b>
			{:else}
				<b>Chatten är av-aktiverad</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<label class="label">Tillåt video från publiken 🤳</label>
	<div class="control">
		<div class="buttons has-addons">
			<button
				class="button"
				class:is-dark={$showSceneOverridesStores.visitorVideoEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("visitorVideoEnabled", 0, true))}
			>
				Automatiskt
			</button>
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStores.visitorVideoEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("visitorVideoEnabled", 2, true))}
			>
				Nej
			</button>
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStores.visitorVideoEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("visitorVideoEnabled", 1, true))}
			>
				Ja
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStores.visitorVideoEnabled === 0}
				Publikens video är tillåten beroende på scen
			{:else if $showSceneOverridesStores.visitorVideoEnabled === 1}
				<b>Video från publiken är alltid tillåtet</b>
			{:else}
				<b>Video från publiken tillåts inte</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<label class="label">Tillåt ljud från publiken 🎤</label>
	<div class="control">
		<div class="buttons has-addons">
			<button
				class="button"
				class:is-dark={$showSceneOverridesStores.visitorAudioEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("visitorAudioEnabled", 0, true))}
			>
				Automatiskt
			</button>
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStores.visitorAudioEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("visitorAudioEnabled", 2, true))}
			>
				Nej
			</button>
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStores.visitorAudioEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("visitorAudioEnabled", 1, true))}
			>
				Ja
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStores.visitorAudioEnabled === 0}
				Publikens ljud är tillåten beroende på scen
			{:else if $showSceneOverridesStores.visitorAudioEnabled === 1}
				<b>Ljud från publiken är alltid tillåtet</b>
			{:else}
				<b>Ljud från publiken tillåts inte</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<label class="label">Tillåt blommor 🌹 och applåder 👏</label>
	<div class="control">
		<div class="buttons has-addons">
			<button
				class="button"
				class:is-dark={$showSceneOverridesStores.gratitudeEffectsEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("gratitudeEffectsEnabled", 0, true))}
			>
				Automatiskt
			</button>
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStores.gratitudeEffectsEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("gratitudeEffectsEnabled", 2, true))}
			>
				Nej
			</button>
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStores.gratitudeEffectsEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("gratitudeEffectsEnabled", 1, true))}
			>
				Ok
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStores.gratitudeEffectsEnabled === 0}
				Beroende på scen kan publiken ibland 🌹 och 👏
			{:else if $showSceneOverridesStores.gratitudeEffectsEnabled === 1}
				<b>Hyllningar från publiken är alltid tillåtna</b>
			{:else}
				<b>Hyllningar från publiken tillåts inte</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<label class="label">Tillåt kastade tomater 🍅</label>
	<div class="control">
		<div class="buttons has-addons">
			<button
				class="button"
				class:is-dark={$showSceneOverridesStores.criticalEffectsEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("criticalEffectsEnabled", 0, true))}
			>
				Automatiskt
			</button>
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStores.criticalEffectsEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("criticalEffectsEnabled", 2, true))}
			>
				Nej
			</button>
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStores.criticalEffectsEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(setSetting("criticalEffectsEnabled", 1, true))}
			>
				Ok
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStores.criticalEffectsEnabled === 0}
				Beroende på scen kan publiken ibland 🍅
			{:else if $showSceneOverridesStores.criticalEffectsEnabled === 1}
				<b>Kritik från publiken är alltid tillåten</b>
			{:else}
				<b>Kritik från publiken tillåts inte</b>
			{/if}
		</p>
	</div>
</div>

{#if hasActiveOverrides}
	<div class="field">
		<div class="control">
			<button class="button is-warning" class:is-loading={isLoading} disabled={isLoading} on:click={resetOverrides}>
				Återställ alla till automatiskt
			</button>
		</div>
		<div class="help-section">
			<p class="help">Återställer alla tvingande inställningar till "Automatiskt" - låter scenerna bestämma</p>
		</div>
	</div>
{/if}

<style lang="scss">
	.field {
		margin-bottom: 1rem;
	}

	.label {
		font-weight: 600;
		color: var(--bulma-text-strong);
		margin-bottom: 0.5rem;
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

	.buttons {
		&.has-addons {
			justify-content: flex-start;
		}
	}

	// Responsive adjustments
	@media screen and (max-width: 768px) {
		.buttons {
			&.has-addons {
				flex-direction: column;

				.button {
					border-radius: var(--bulma-radius) !important;
					margin-bottom: 0.25rem;
				}
			}
		}
	}
</style>
