<script lang="ts">
	import type { Scene } from "~/types/serverSideTypes";
	import SceneSelectorControl from "./_SceneSelectorControl.svelte";
	import Accordion from "../Accordion.svelte";
	import { onMount } from "svelte";
	import { peersStore } from "~/api/media";
	import { configManager, currentSceneStore, sceneSettingsStore, resetSettings } from "~/api/config";

	// Error handling state
	let errorMessage: string = "";
	let isLoading = false;

	// Sets the displayed error message and clears after 8 seconds
	function setError(message: string) {
		errorMessage = message;
		setTimeout(() => {
			errorMessage = "";
		}, 8000);
	}

	// Handle API call results
	async function handleApiCall(apiCall: Promise<{ success: boolean; error?: string }>) {
		isLoading = true;
		errorMessage = "";

		try {
			const result = await apiCall;
			if (!result.success) {
				setError(result.error || "Okänt fel");
			}
		} catch (error) {
			console.error("API call failed:", error);
			setError("Ett oväntat fel uppstod. Försök igen.");
		} finally {
			isLoading = false;
		}
	}
	import { stageChatEnabledStore } from "~/api/media";

	$: peers = Object.values($peersStore || {}).filter((p) => (p.actor || p.manager) && !p.banned);

	// Track expanded states for each scene
	let expandedScenes: Record<string, boolean> = {};

	// Check if any override settings are not automatic
	$: hasActiveOverrides =
		$sceneSettingsStore.curtains !== 0 ||
		$sceneSettingsStore.chatEnabled !== 0 ||
		$sceneSettingsStore.visitorVideoEnabled !== 0 ||
		$sceneSettingsStore.visitorAudioEnabled !== 0 ||
		$sceneSettingsStore.effectsEnabled !== 0;

	const auto: Scene = {
		name: "Automatisk",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: false,
		visitorVideoEnabled: false,
		layout: [],
	};
	const empty: Scene = {
		name: "Helt tom",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: false,
		visitorVideoEnabled: false,
		layout: [[{ type: "empty" }]],
	};
	const chat: Scene = {
		name: "Chatduell",
		chatEnabled: false,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [[{ type: "actor", peerId: "-1" }, { type: "chat" }, { type: "actor", peerId: "-1" }]],
	};
	const oneXOne: Scene = {
		name: "En i fokus",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [[{ type: "actor", peerId: "-1" }]],
	};
	const oneXTwo: Scene = {
		name: "Två bredvid varandra",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
		],
	};
	const twoXTwo: Scene = {
		name: "Fyra rutor",
		chatEnabled: true,
		curtains: false,
		effectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: true,
		layout: [
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
		],
	};

	// Sync actual stage stores when the selected scene changes
	onMount(() => {
		const stop = currentSceneStore.subscribe((scene) => {
			if (scene) {
				stageChatEnabledStore.set(scene?.chatEnabled || false);
			}
		});

		return () => {
			stop();
		};
	});

	async function handleSceneSelect(event: CustomEvent<Scene>) {
		// Persist the scene selection to the server
		await handleApiCall(configManager.updateCurrentScene(event.detail));
		// Collapse all expanded scenes after selection
		expandedScenes = {};
	}

	function handleSceneUpdate() {
		// Handle scene layout updates (peer assignments)
		// This already triggers persistence if the scene is currently selected
	}

	// Reset all override settings to automatic
	async function resetOverrides() {
		await handleApiCall(resetSettings(true)); // persist to show
	}

	// const doDesignTest = (style: "simple" | "ukraine") => {
	// 	if (style == "simple") {
	// 		document.documentElement.style.setProperty("--channelle-main-bg-color", "black");
	// 		document.documentElement.style.setProperty("--channelle-main-text-color", "white");
	// 		document.documentElement.style.setProperty("--channelle-menu-bg-color", "black");
	// 		document.documentElement.style.setProperty("--channelle-menu-text-color", " white");
	// 	} else {
	// 		document.documentElement.style.setProperty("--channelle-main-bg-color", "blue");
	// 		document.documentElement.style.setProperty("--channelle-main-text-color", "yellow");
	// 		document.documentElement.style.setProperty("--channelle-menu-bg-color", "yellow");
	// 		document.documentElement.style.setProperty("--channelle-menu-text-color", " red");
	// 	}
	// document.documentElement.style.setProperty("--bulma-primary-h", "246deg");
	// document.documentElement.style.setProperty("--bulma-primary-s", "100%");
	// document.documentElement.style.setProperty("--bulma-primary-l", "48.4%");
	// document.documentElement.style.setProperty("--bulma-info-h", "60deg");
	// document.documentElement.style.setProperty("--bulma-info-s", "100%");
	// document.documentElement.style.setProperty("--bulma-info-l", "63.7%");
	// document.documentElement.style.setProperty("--bulma-scheme-h", "60deg");
	// document.documentElement.style.setProperty("--bulma-scheme-s", "100%");
	// document.documentElement.style.setProperty("--bulma-scheme-l", "63.7%");
	// document.documentElement.style.setProperty(
	// 	"--bulma-scheme-main-l",
	// 	"63.7%"
	// );
	// document.documentElement.style.setProperty("--bulma-link-h", "317deg");
	// document.documentElement.style.setProperty("--bulma-link-s", "41.2%");
	// document.documentElement.style.setProperty("--bulma-link-l", "93.3%");
	// document.documentElement.style.setProperty("--bulma-link-l", "93.3%");
	// document.documentElement.style.setProperty("--bulma-link-l", "93.3%");

	// document.documentElement.style.setProperty(
	// 	"--bulma-black",
	// 	"var(--bulma-primary)"
	// );
	// document.documentElement.style.setProperty(
	// 	"--bulma-button-static-background-color",
	// 	"var(--bulma-black)"
	// );
	// document.documentElement.style.setProperty(
	// 	"--bulma-body-background-color",
	// 	"var(--bulma-black)"
	// );
	//};
</script>

<div class="scene-selector-instrument">
	<h1 class="title">Sceninställningar</h1>

	{#if errorMessage}
		<div class="notification is-danger is-light">
			<p class="has-text-danger">✗ {errorMessage}</p>
		</div>
	{/if}

	<div class="scene-content">
		<Accordion title="Ange tvingande inställningar" isOpen={false}>
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
							<b>Ridån är dold</b>
						{:else}
							<b>Ridån visas</b>
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
				<label class="label">Tillåt blommor och applåder 🌹👏</label>
				<div class="control">
					<div class="buttons has-addons">
						<button
							class="button is-danger"
							class:is-light={$sceneSettingsStore.effectsEnabled !== 2}
							class:is-loading={isLoading}
							disabled={isLoading}
							on:click={() => handleApiCall(configManager.updateEffectsEnabledOverride(2))}
						>
							Nej
						</button>
						<button
							class="button is-info"
							class:is-light={$sceneSettingsStore.effectsEnabled !== 0}
							class:is-loading={isLoading}
							disabled={isLoading}
							on:click={() => handleApiCall(configManager.updateEffectsEnabledOverride(0))}
						>
							Automatiskt
						</button>
						<button
							class="button is-success"
							class:is-light={$sceneSettingsStore.effectsEnabled !== 1}
							class:is-loading={isLoading}
							disabled={isLoading}
							on:click={() => handleApiCall(configManager.updateEffectsEnabledOverride(1))}
						>
							Ja
						</button>
					</div>
				</div>
				<div class="help-section">
					<p class="help">
						{#if $sceneSettingsStore.effectsEnabled === 0}
							Beroende på scen kan publiken ibland 🌹 och 👏
						{:else if $sceneSettingsStore.effectsEnabled === 1}
							<b>Hyllningar från publiken är alltid tillåtet</b>
						{:else}
							<b>Hyllningar från publiken tillåts inte</b>
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
		</Accordion>

		<div class="field">
			<label class="label">Välj aktiv scen</label>
			<div class="scene-controls">
				<SceneSelectorControl
					layout={auto}
					{peers}
					selectedLayout={$currentSceneStore}
					bind:expanded={expandedScenes[auto.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={empty}
					{peers}
					selectedLayout={$currentSceneStore}
					bind:expanded={expandedScenes[empty.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={oneXOne}
					{peers}
					selectedLayout={$currentSceneStore}
					bind:expanded={expandedScenes[oneXOne.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={oneXTwo}
					{peers}
					selectedLayout={$currentSceneStore}
					bind:expanded={expandedScenes[oneXTwo.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={chat}
					{peers}
					selectedLayout={$currentSceneStore}
					bind:expanded={expandedScenes[chat.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={twoXTwo}
					{peers}
					selectedLayout={$currentSceneStore}
					bind:expanded={expandedScenes[twoXTwo.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.scene-selector-instrument {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.scene-content {
		flex: 1;
		overflow-y: auto;
	}

	.field {
		margin-bottom: 1.5rem;
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

	.scene-controls {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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
