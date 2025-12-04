<script lang="ts">
	import type { Scene } from "~/types/serverSideTypes";
	import SceneSelectorControl from "./_SceneSelectorControl.svelte";
	import Accordion from "../Accordion.svelte";
	import ForcedSettingsContent from "./_ForcedSettingsContent.svelte";
	import { updateConfigurationSettings, showSelectedSceneStore, showPeersStore } from "~/api/backstage";

	export let hideForcedSettings: boolean = false;

	$: peers = Object.values($showPeersStore || {}).filter((p) => (p.actor || p.manager) && !p.banned);

	// Track expanded states for each scene
	let expandedScenes: Record<string, boolean> = {};

	// Track modified layouts for each scene
	let modifiedLayouts: Record<string, Scene> = {};

	// Sync the selected scene from the server to modifiedLayouts
	$: if ($showSelectedSceneStore) {
		modifiedLayouts[$showSelectedSceneStore.name] = $showSelectedSceneStore;
	}

	let errorMessage: string = "";

	const auto: Scene = {
		name: "Alla",
		chatEnabled: true,
		curtains: false,
		gratitudeEffectsEnabled: false,
		criticalEffectsEnabled: false,
		visitorAudioEnabled: false,
		visitorVideoEnabled: true,
		layout: [],
	};
	const empty: Scene = {
		name: "Helt tom",
		chatEnabled: true,
		curtains: false,
		gratitudeEffectsEnabled: true,
		criticalEffectsEnabled: true,
		visitorAudioEnabled: false,
		visitorVideoEnabled: false,
		layout: [[{ type: "empty" }]],
	};
	const chat: Scene = {
		name: "Chatduell",
		chatEnabled: false,
		curtains: false,
		gratitudeEffectsEnabled: true,
		criticalEffectsEnabled: false,
		visitorAudioEnabled: true,
		visitorVideoEnabled: false,
		layout: [[{ type: "actor", peerId: "-1" }, { type: "chat" }, { type: "actor", peerId: "-1" }]],
	};
	const oneXOne: Scene = {
		name: "En i fokus",
		chatEnabled: true,
		curtains: false,
		gratitudeEffectsEnabled: true,
		criticalEffectsEnabled: false,
		visitorAudioEnabled: true,
		visitorVideoEnabled: false,
		layout: [[{ type: "actor", peerId: "-1" }]],
	};
	const oneXTwo: Scene = {
		name: "Två bredvid varandra",
		chatEnabled: true,
		curtains: false,
		gratitudeEffectsEnabled: true,
		criticalEffectsEnabled: false,
		visitorAudioEnabled: true,
		visitorVideoEnabled: false,
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
		gratitudeEffectsEnabled: true,
		criticalEffectsEnabled: true,
		visitorAudioEnabled: true,
		visitorVideoEnabled: false,
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

	function handleError(message: string) {
		errorMessage = message;
		// Clear error after 8 seconds
		setTimeout(() => {
			errorMessage = "";
		}, 8000);
	}

	async function handleSceneSelect(event: CustomEvent<Scene>) {
		errorMessage = "";
		// Use the modified layout if it exists, otherwise use the original
		const sceneToSelect = modifiedLayouts[event.detail.name] || event.detail;
		const result = await updateConfigurationSettings({ selectedScene: sceneToSelect });

		if (!result.success) {
			handleError(result.error || "Failed to update scene");
		} else {
			// Collapse all expanded scenes after successful selection
			expandedScenes = {};
		}
	}

	function handleSceneUpdate(event: CustomEvent<Scene>) {
		// Store the modified layout
		modifiedLayouts[event.detail.name] = event.detail;
	}

	// TODO: Theming
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
	{#if !hideForcedSettings}
		<Accordion title="Ange tvingande inställningar" isOpen={false}>
			<ForcedSettingsContent on:error={(e) => handleError(e.detail)} />
		</Accordion>
	{/if}

	<h1 class="title">Aktiv scen</h1>

	{#if errorMessage}
		<div class="notification is-danger is-light">
			<p class="has-text-danger">✗ {errorMessage}</p>
		</div>
	{/if}

	<div class="scene-content">
		<div class="field">
			<label class="label">Välj aktiv scen</label>
			<div class="scene-controls">
				<SceneSelectorControl
					layout={modifiedLayouts[auto.name] || auto}
					{peers}
					selectedLayout={$showSelectedSceneStore}
					bind:expanded={expandedScenes[auto.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={modifiedLayouts[empty.name] || empty}
					{peers}
					selectedLayout={$showSelectedSceneStore}
					bind:expanded={expandedScenes[empty.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={modifiedLayouts[oneXOne.name] || oneXOne}
					{peers}
					selectedLayout={$showSelectedSceneStore}
					bind:expanded={expandedScenes[oneXOne.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={modifiedLayouts[oneXTwo.name] || oneXTwo}
					{peers}
					selectedLayout={$showSelectedSceneStore}
					bind:expanded={expandedScenes[oneXTwo.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={modifiedLayouts[chat.name] || chat}
					{peers}
					selectedLayout={$showSelectedSceneStore}
					bind:expanded={expandedScenes[chat.name]}
					on:select={handleSceneSelect}
					on:update={handleSceneUpdate}
				/>
				<SceneSelectorControl
					layout={modifiedLayouts[twoXTwo.name] || twoXTwo}
					{peers}
					selectedLayout={$showSelectedSceneStore}
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
		.scene-controls {
			gap: 0.25rem;
		}
	}
</style>
