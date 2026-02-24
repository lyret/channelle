<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import {
		showSceneOverridesStore,
		updateConfigurationSettings,
		automateOverridenSettings,
		showSelectedSceneStore,
	} from "~/api/backstage/backstageClient";
	import type { EditableShowAttributes } from "~/types/serverSideTypes";

	let isLoading = false;
	const dispatcher = createEventDispatcher<{ error: string }>();

	// Check if any override settings are not automatic
	$: hasActiveOverrides =
		$showSceneOverridesStore.curtainsOverride !== 0 ||
		$showSceneOverridesStore.chatEnabledOverride !== 0 ||
		$showSceneOverridesStore.visitorVideoEnabledOverride !== 0 ||
		$showSceneOverridesStore.visitorAudioEnabledOverride !== 0 ||
		$showSceneOverridesStore.gratitudeEffectsEnabledOverride !== 0 ||
		$showSceneOverridesStore.criticalEffectsEnabledOverride !== 0;

	// Helper to get scene value descriptions
	function getCurtainsSceneValue() {
		return $showSelectedSceneStore?.curtains === 1 ? 'Nere' : 'Uppe';
	}

	function getChatSceneValue() {
		return $showSelectedSceneStore?.chatEnabled ? 'Visa' : 'Dölj';
	}

	function getVisitorVideoSceneValue() {
		return $showSelectedSceneStore?.visitorVideoEnabled ? 'Ja' : 'Nej';
	}

	function getVisitorAudioSceneValue() {
		return $showSelectedSceneStore?.visitorAudioEnabled ? 'Ja' : 'Nej';
	}

	function getGratitudeSceneValue() {
		return $showSelectedSceneStore?.gratitudeEffectsEnabled ? 'Ok' : 'Nej';
	}

	function getCriticalSceneValue() {
		return $showSelectedSceneStore?.criticalEffectsEnabled ? 'Ok' : 'Nej';
	}

	async function handleUpdate(update: Partial<EditableShowAttributes>) {
		isLoading = true;
		const result = await updateConfigurationSettings(update);
		isLoading = false;

		if (!result.success) {
			dispatcher("error", result.error || "Failed to update setting");
		}
	}

	async function handleAutomateSettings() {
		isLoading = true;
		const result = await automateOverridenSettings();
		isLoading = false;

		if (!result.success) {
			dispatcher("error", result.error || "Failed to update setting");
		}
	}
</script>

<p>Dessa inställningar åsidosätter alltid de inställningar som finns i den aktiva scenen.</p>
<p>Använd "Automatiskt" för att låta varje scen bestämma sina egna inställningar.</p>

<div class="field mt-2">
	<p class="label">Ridån 🎭</p>
	<div class="level is-mobile">
		<div class="level-item">
			<button
				class="button"
				class:is-warning={$showSceneOverridesStore.curtainsOverride === 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ curtainsOverride: 0 })}
			>
				Automatiskt ({getCurtainsSceneValue()})
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStore.curtainsOverride !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ curtainsOverride: 2 })}
			>
				Uppe
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStore.curtainsOverride !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ curtainsOverride: 1 })}
			>
				Nere
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStore.curtainsOverride === 0}
				Visas automatiskt enligt vald scen (nu: {getCurtainsSceneValue()})
			{:else if $showSceneOverridesStore.curtainsOverride === 1}
				<b>Ridån visas alltid (täcker innehållet på scenen)</b>
			{:else}
				<b>Ridån visas aldrig</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<p class="label">Visa chatt-panelen 💬</p>
	<div class="level is-mobile">
		<div class="level-item">
			<button
				class="button"
				class:is-warning={$showSceneOverridesStore.chatEnabledOverride === 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ chatEnabledOverride: 0 })}
			>
				Automatiskt ({getChatSceneValue()})
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStore.chatEnabledOverride !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ chatEnabledOverride: 2 })}
			>
				Dölj
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStore.chatEnabledOverride !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ chatEnabledOverride: 1 })}
			>
				Visa
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStore.chatEnabledOverride === 0}
				Chatten visas beroende på vald scen (nu: {getChatSceneValue()})
			{:else if $showSceneOverridesStore.chatEnabledOverride === 1}
				<b>Chatten visas alltid</b>
			{:else}
				<b>Chatten visas aldrig</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<p class="label">Tillåt video från publiken 🤳</p>
	<div class="level is-mobile">
		<div class="level-item">
			<button
				class="button"
				class:is-warning={$showSceneOverridesStore.visitorVideoEnabledOverride === 0 && $showSelectedSceneStore?.visitorVideoEnabled}
				class:is-loading={isLoading}
				disabled={isLoading || !$showSelectedSceneStore?.visitorVideoEnabled}
				on:click={() => handleUpdate({ visitorVideoEnabledOverride: 0 })}
			>
				Automatiskt ({getVisitorVideoSceneValue()})
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStore.visitorVideoEnabledOverride !== 2 || !$showSelectedSceneStore?.visitorVideoEnabled}
				class:is-loading={isLoading}
				disabled={isLoading || !$showSelectedSceneStore?.visitorVideoEnabled}
				on:click={() => handleUpdate({ visitorVideoEnabledOverride: 2 })}
			>
				Nej
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStore.visitorVideoEnabledOverride !== 1 || !$showSelectedSceneStore?.visitorVideoEnabled}
				class:is-loading={isLoading}
				disabled={isLoading || !$showSelectedSceneStore?.visitorVideoEnabled}
				on:click={() => handleUpdate({ visitorVideoEnabledOverride: 1 })}
			>
				Ja
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if !$showSelectedSceneStore?.visitorVideoEnabled}
				<b>OBS: Fungerar endast där scen-layouten tillåter det (exempelvis "alla")</b>
			{:else if $showSceneOverridesStore.visitorVideoEnabledOverride === 0}
				Publikens video är tillåten beroende på scen (nu: {getVisitorVideoSceneValue()})
			{:else if $showSceneOverridesStore.visitorVideoEnabledOverride === 1}
				<b>Video från publiken är alltid tillåtet</b>
			{:else}
				<b>Video från publiken tillåts aldrig</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<p class="label">Tillåt ljud från publiken 🎤</p>
	<div class="level is-mobile">
		<div class="level-item">
			<button
				class="button"
				class:is-warning={$showSceneOverridesStore.visitorAudioEnabledOverride === 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ visitorAudioEnabledOverride: 0 })}
			>
				Automatiskt ({getVisitorAudioSceneValue()})
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStore.visitorAudioEnabledOverride !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ visitorAudioEnabledOverride: 2 })}
			>
				Nej
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStore.visitorAudioEnabledOverride !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ visitorAudioEnabledOverride: 1 })}
			>
				Ja
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStore.visitorAudioEnabledOverride === 0}
				Publikens ljud är tillåten beroende på scen (nu: {getVisitorAudioSceneValue()})
			{:else if $showSceneOverridesStore.visitorAudioEnabledOverride === 1}
				<b>Ljud från publiken är alltid tillåtet</b>
			{:else}
				<b>Ljud från publiken tillåts aldrig</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<p class="label">Tillåt blommor 🌹 och applåder 👏</p>
	<div class="level is-mobile">
		<div class="level-item">
			<button
				class="button"
				class:is-warning={$showSceneOverridesStore.gratitudeEffectsEnabledOverride === 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ gratitudeEffectsEnabledOverride: 0 })}
			>
				Automatiskt ({getGratitudeSceneValue()})
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStore.gratitudeEffectsEnabledOverride !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ gratitudeEffectsEnabledOverride: 2 })}
			>
				Nej
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStore.gratitudeEffectsEnabledOverride !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ gratitudeEffectsEnabledOverride: 1 })}
			>
				Ok
			</button>
		</div>
	</div>

	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStore.gratitudeEffectsEnabledOverride === 0}
				Beroende på scen kan publiken ibland 🌹 och 👏 (nu: {getGratitudeSceneValue()})
			{:else if $showSceneOverridesStore.gratitudeEffectsEnabledOverride === 1}
				<b>Hyllningar från publiken är alltid tillåtna</b>
			{:else}
				<b>Hyllningar från publiken tillåts aldrig</b>
			{/if}
		</p>
	</div>
</div>

<div class="field">
	<p class="label">Tillåt kastade tomater 🍅</p>
	<div class="level is-mobile">
		<div class="level-item">
			<button
				class="button"
				class:is-warning={$showSceneOverridesStore.criticalEffectsEnabledOverride === 0}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ criticalEffectsEnabledOverride: 0 })}
			>
				Automatiskt ({getCriticalSceneValue()})
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-danger"
				class:is-light={$showSceneOverridesStore.criticalEffectsEnabledOverride !== 2}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ criticalEffectsEnabledOverride: 2 })}
			>
				Nej
			</button>
		</div>
		<div class="level-item">
			<button
				class="button is-success"
				class:is-light={$showSceneOverridesStore.criticalEffectsEnabledOverride !== 1}
				class:is-loading={isLoading}
				disabled={isLoading}
				on:click={() => handleUpdate({ criticalEffectsEnabledOverride: 1 })}
			>
				Ok
			</button>
		</div>
	</div>
	<div class="help-section">
		<p class="help">
			{#if $showSceneOverridesStore.criticalEffectsEnabledOverride === 0}
				Beroende på scen kan publiken ibland kasta ruttna tomater (nu: {getCriticalSceneValue()})
			{:else if $showSceneOverridesStore.criticalEffectsEnabledOverride === 1}
				<b>Kritik från publiken är alltid tillåten</b>
			{:else}
				<b>Kritik från publiken tillåts aldrig</b>
			{/if}
		</p>
	</div>
</div>

{#if hasActiveOverrides}
	<div class="field">
		<div class="level is-mobile">
			<div class="level-item">
				<button class="button is fullwidth is-warning" class:is-loading={isLoading} disabled={isLoading} on:click={handleAutomateSettings}>
					Återställ alla till automatiskt
				</button>
			</div>
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
