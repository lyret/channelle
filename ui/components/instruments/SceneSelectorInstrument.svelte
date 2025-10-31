<script lang="ts">
	import type { Scene } from "~/types/serverSideTypes";
	import SceneSelectorControl from "./_SceneSelectorControl.svelte";
	import Accordion from "../Accordion.svelte";
	import { onMount } from "svelte";
	import {
		peersStore,
		stageChatEnabledStore,
		stageLayoutStore,
		stageSceneSettingsStore,
		sceneStore,
		setScene,
		setStageCurtainsForced,
		setStageChatEnabledForced,
		setStageEffectsEnabledForced,
		setStageVisitorAudioEnabledForced,
		setStageVisitorVideoEnabledForced,
	} from "~/api/room";
	import { configManager, currentModeStore, AppMode } from "~/api/show/configManager";

	$: peers = Object.values($peersStore || {}).filter((p) => (p.actor || p.manager) && !p.banned);

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

	// Sync actual stage layout stores when the selected scene changes
	onMount(() => {
		const stop = sceneStore.subscribe((scene) => {
			if (scene) {
				stageChatEnabledStore.set(scene?.chatEnabled || false);
				stageLayoutStore.set(scene?.layout || []);
			}
		});

		return () => {
			stop();
		};
	});

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

<Accordion title="Tvingade inställningar" isOpen={false}>
	<p class="has-text-centered pb-2 mt-2">Dessa inställningar kommer gälla oavsett vilken scen som pågår.</p>
	<!-- Scene curtains -->
	<p class="has-text-centered pb-2 mt-2">Visa ridån 🎭</p>
	<div class="buttons has-addons is-centered">
		<button class="button is-danger" class:is-light={$stageSceneSettingsStore.curtains !== 2} on:click={() => configManager.updateCurtainsOverride(2)}>
			Dölj
		</button>
		<button class="button is-info" class:is-light={$stageSceneSettingsStore.curtains !== 0} on:click={() => configManager.updateCurtainsOverride(0)}>
			Automatiskt
		</button>
		<button class="button is-success" class:is-light={$stageSceneSettingsStore.curtains !== 1} on:click={() => configManager.updateCurtainsOverride(1)}>
			Visa
		</button>
	</div>

	<!-- Chat button -->
	<p class="has-text-centered pb-2 mt-2">Visa chatt-panelen 💬</p>
	<div class="buttons has-addons is-centered">
		<button
			class="button is-danger"
			class:is-light={$stageSceneSettingsStore.chatEnabled !== 2}
			on:click={() => configManager.updateChatEnabledOverride(2)}
		>
			Dölj
		</button>
		<button class="button is-info" class:is-light={$stageSceneSettingsStore.chatEnabled !== 0} on:click={() => configManager.updateChatEnabledOverride(0)}>
			Automatiskt
		</button>
		<button
			class="button is-success"
			class:is-light={$stageSceneSettingsStore.chatEnabled !== 1}
			on:click={() => configManager.updateChatEnabledOverride(1)}
		>
			Visa
		</button>
	</div>

	<!-- Visitor video -->
	<p class="has-text-centered pb-2 mt-2">Tillåt video från publiken 🤳</p>
	<div class="buttons has-addons is-centered">
		<button
			class="button is-danger"
			class:is-light={$stageSceneSettingsStore.visitorVideoEnabled !== 2}
			on:click={() => configManager.updateVisitorVideoEnabledOverride(2)}
		>
			Nej
		</button>
		<button
			class="button is-info"
			class:is-light={$stageSceneSettingsStore.visitorVideoEnabled !== 0}
			on:click={() => configManager.updateVisitorVideoEnabledOverride(0)}
		>
			Automatiskt
		</button>
		<button
			class="button is-success"
			class:is-light={$stageSceneSettingsStore.visitorVideoEnabled !== 1}
			on:click={() => configManager.updateVisitorVideoEnabledOverride(1)}
		>
			Ja
		</button>
	</div>

	<!-- Visitor audio -->
	<p class="has-text-centered pb-2 mt-2">Tillåt ljud från publiken 🎤</p>
	<div class="buttons has-addons is-centered">
		<button
			class="button is-danger"
			class:is-light={$stageSceneSettingsStore.visitorAudioEnabled !== 2}
			on:click={() => configManager.updateVisitorAudioEnabledOverride(2)}
		>
			Nej
		</button>
		<button
			class="button is-info"
			class:is-light={$stageSceneSettingsStore.visitorAudioEnabled !== 0}
			on:click={() => configManager.updateVisitorAudioEnabledOverride(0)}
		>
			Automatiskt
		</button>
		<button
			class="button is-success"
			class:is-light={$stageSceneSettingsStore.visitorAudioEnabled !== 1}
			on:click={() => configManager.updateVisitorAudioEnabledOverride(1)}
		>
			Ja
		</button>
	</div>

	<!-- Visitor effects -->
	<p class="has-text-centered pb-2 mt-2">Tillåt blommor och applåder 🌹👏</p>
	<div class="buttons has-addons is-centered">
		<button
			class="button is-danger"
			class:is-light={$stageSceneSettingsStore.effectsEnabled !== 2}
			on:click={() => configManager.updateEffectsEnabledOverride(2)}
		>
			Nej
		</button>
		<button
			class="button is-info"
			class:is-light={$stageSceneSettingsStore.effectsEnabled !== 0}
			on:click={() => configManager.updateEffectsEnabledOverride(0)}
		>
			Automatiskt
		</button>
		<button
			class="button is-success"
			class:is-light={$stageSceneSettingsStore.effectsEnabled !== 1}
			on:click={() => configManager.updateEffectsEnabledOverride(1)}
		>
			Ja
		</button>
	</div>
</Accordion>

<h1 class="title">Välj aktiv scen</h1>

<SceneSelectorControl layout={auto} {peers} selectedLayout={$sceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
<SceneSelectorControl layout={empty} {peers} selectedLayout={$sceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
<SceneSelectorControl layout={oneXOne} {peers} selectedLayout={$sceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
<SceneSelectorControl layout={oneXTwo} {peers} selectedLayout={$sceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
<SceneSelectorControl layout={chat} {peers} selectedLayout={$sceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
<SceneSelectorControl layout={twoXTwo} {peers} selectedLayout={$sceneStore} on:select={(e) => configManager.updateCurrentScene(e.detail)} />
