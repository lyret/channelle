<script lang="ts">
	import { configManager, sceneSettingsStore, resetSettings } from "~/api/config";

	export let errorMessage: string = "";
	export let isLoading: boolean = false;
	export let handleApiCall: (apiCall: Promise<{ success: boolean; error?: string }>) => Promise<void>;

	// Check if any override settings are not automatic
	$: hasActiveOverrides =
		$sceneSettingsStore.curtains !== 0 ||
		$sceneSettingsStore.chatEnabled !== 0 ||
		$sceneSettingsStore.visitorVideoEnabled !== 0 ||
		$sceneSettingsStore.visitorAudioEnabled !== 0 ||
		$sceneSettingsStore.gratitudeEffectsEnabled !== 0 ||
		$sceneSettingsStore.criticalEffectsEnabled !== 0;

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
				class="button is-danger"
				class:is-light={$sceneSettingsStore.curtains !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateCurtainsOverride(2))}
			>
				Dölj
			</button>
			<button
				class="button is-info"
				class:is-light={$sceneSettingsStore.curtains !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateCurtainsOverride(0))}
			>
				Automatiskt
			</button>
			<button
				class="button is-success"
				class:is-light={$sceneSettingsStore.curtains !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateCurtainsOverride(1))}
			>
				Visa
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $sceneSettingsStore.curtains === 0}
				Visas automatiskt enligt vald scen
			{:else if $sceneSettingsStore.curtains === 1}
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
				class="button is-danger"
				class:is-light={$sceneSettingsStore.chatEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateChatEnabledOverride(2))}
			>
				Dölj
			</button>
			<button
				class="button is-info"
				class:is-light={$sceneSettingsStore.chatEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateChatEnabledOverride(0))}
			>
				Automatiskt
			</button>
			<button
				class="button is-success"
				class:is-light={$sceneSettingsStore.chatEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateChatEnabledOverride(1))}
			>
				Visa
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $sceneSettingsStore.chatEnabled === 0}
				Chatten visas beroende på vald scen
			{:else if $sceneSettingsStore.chatEnabled === 1}
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
				class="button is-danger"
				class:is-light={$sceneSettingsStore.visitorVideoEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateVisitorVideoEnabledOverride(2))}
			>
				Nej
			</button>
			<button
				class="button is-info"
				class:is-light={$sceneSettingsStore.visitorVideoEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateVisitorVideoEnabledOverride(0))}
			>
				Automatiskt
			</button>
			<button
				class="button is-success"
				class:is-light={$sceneSettingsStore.visitorVideoEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateVisitorVideoEnabledOverride(1))}
			>
				Ja
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $sceneSettingsStore.visitorVideoEnabled === 0}
				Publikens video är tillåten beroende på scen
			{:else if $sceneSettingsStore.visitorVideoEnabled === 1}
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
				class="button is-danger"
				class:is-light={$sceneSettingsStore.visitorAudioEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateVisitorAudioEnabledOverride(2))}
			>
				Nej
			</button>
			<button
				class="button is-info"
				class:is-light={$sceneSettingsStore.visitorAudioEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateVisitorAudioEnabledOverride(0))}
			>
				Automatiskt
			</button>
			<button
				class="button is-success"
				class:is-light={$sceneSettingsStore.visitorAudioEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateVisitorAudioEnabledOverride(1))}
			>
				Ja
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $sceneSettingsStore.visitorAudioEnabled === 0}
				Publikens ljud är tillåten beroende på scen
			{:else if $sceneSettingsStore.visitorAudioEnabled === 1}
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
				class="button is-danger"
				class:is-light={$sceneSettingsStore.gratitudeEffectsEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateGratitudeEffectsEnabledOverride(2))}
			>
				Nej
			</button>
			<button
				class="button is-info"
				class:is-light={$sceneSettingsStore.gratitudeEffectsEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateGratitudeEffectsEnabledOverride(0))}
			>
				Automatiskt
			</button>
			<button
				class="button is-success"
				class:is-light={$sceneSettingsStore.gratitudeEffectsEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateGratitudeEffectsEnabledOverride(1))}
			>
				Ok
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $sceneSettingsStore.gratitudeEffectsEnabled === 0}
				Beroende på scen kan publiken ibland 🌹 och 👏
			{:else if $sceneSettingsStore.gratitudeEffectsEnabled === 1}
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
				class="button is-danger"
				class:is-light={$sceneSettingsStore.criticalEffectsEnabled !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateCriticalEffectsEnabledOverride(2))}
			>
				Nej
			</button>
			<button
				class="button is-info"
				class:is-light={$sceneSettingsStore.criticalEffectsEnabled !== 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateCriticalEffectsEnabledOverride(0))}
			>
				Automatiskt
			</button>
			<button
				class="button is-success"
				class:is-light={$sceneSettingsStore.criticalEffectsEnabled !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleApiCall(configManager.updateCriticalEffectsEnabledOverride(1))}
			>
				Ok
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $sceneSettingsStore.criticalEffectsEnabled === 0}
				Beroende på scen kan publiken ibland 🍅
			{:else if $sceneSettingsStore.criticalEffectsEnabled === 1}
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
				Återställ till automatiskt
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
