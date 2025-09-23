<script lang="ts">
	import type { PredefinedLayout } from "~/types/serverSideTypes";
	import SceneSelectorControl from "./SceneSelectorControl.svelte";
	import { onMount } from "svelte";
	import {
		peersStore,
		stageChatEnabledStore,
		stageCurtainsStore,
		stageEffectsEnabledStore,
		stageHaveVisitorAudioEnabledStore,
		stageLayoutStore,
		stagePredefinedLayoutStore,
	} from "~/api/room";

	$: participants = Object.values($peersStore).filter((p) => (p.actor || p.manager) && !p.banned);

	const auto: PredefinedLayout = {
		name: "Automatisk",
		chatEnabled: true,
		layout: [],
	};
	const empty: PredefinedLayout = {
		name: "Helt tom",
		chatEnabled: true,
		layout: [[{ type: "empty" }]],
	};
	const chat: PredefinedLayout = {
		name: "Chatduell",
		chatEnabled: false,
		layout: [[{ type: "actor", peerId: "-1" }, { type: "chat" }, { type: "actor", peerId: "-1" }]],
	};
	const oneXOne: PredefinedLayout = {
		name: "En i fokus",
		chatEnabled: true,
		layout: [[{ type: "actor", peerId: "-1" }]],
	};
	const oneXTwo: PredefinedLayout = {
		name: "Två bredvid varandra",
		chatEnabled: true,
		layout: [
			[
				{ type: "actor", peerId: "-1" },
				{ type: "actor", peerId: "-1" },
			],
		],
	};
	const twoXTwo: PredefinedLayout = {
		name: "Fyra rutor",
		chatEnabled: true,
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

	// Sync actual stage layout stores when the selected predefined layout changes
	onMount(() => {
		const stop = stagePredefinedLayoutStore.subscribe((layout) => {
			if (layout) {
				stageChatEnabledStore.set(layout?.chatEnabled || false);
			}
			stageLayoutStore.set(layout?.layout || []);
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

<h1 class="title">Sceninställningar</h1>

<h1 class="title is-4">Tvingade inställningar</h1>
<p class="subtitle is-6">Dessa inställningar kommer gälla oavsett vilken scen som pågår.</p>

<!-- Scene curtains -->
<p class="has-text-centered pb-2 mt-2">Visa ridån 🎭</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$stageCurtainsStore} on:click={() => stageCurtainsStore.set(false)}>Dölj</button>
	<button class="button is-info" class:is-light={$stageCurtainsStore}>Automatiskt</button>
	<button class="button is-success" class:is-light={!$stageCurtainsStore} on:click={() => stageCurtainsStore.set(true)}>Visa</button>
</div>

<!-- Chat button -->
<p class="has-text-centered pb-2 mt-2">Visa chatt-panelen 💬</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$stageChatEnabledStore} on:click={() => stageChatEnabledStore.set(false)}>Dölj</button>
	<button class="button is-info" class:is-light={$stageChatEnabledStore}>Automatiskt</button>
	<button class="button is-success" class:is-light={!$stageChatEnabledStore} on:click={() => stageChatEnabledStore.set(true)}>Visa</button>
</div>

<!-- Visitor audio -->
<p class="has-text-centered pb-2 mt-2">Tillåt ljud från publiken 🎤</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$stageHaveVisitorAudioEnabledStore} on:click={() => stageHaveVisitorAudioEnabledStore.set(false)}
		>Nej</button
	>
	<button class="button is-info" class:is-light={$stageHaveVisitorAudioEnabledStore}>Automatiskt</button>
	<button class="button is-success" class:is-light={!$stageHaveVisitorAudioEnabledStore} on:click={() => stageHaveVisitorAudioEnabledStore.set(true)}
		>Ja</button
	>
</div>

<!-- Visitor effects -->
<p class="has-text-centered pb-2 mt-2">Tillåt blommor och applåder 🌹👏</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$stageEffectsEnabledStore} on:click={() => stageEffectsEnabledStore.set(false)}>Nej</button>
	<button class="button is-info" class:is-light={$stageEffectsEnabledStore}>Automatiskt</button>
	<button class="button is-success" class:is-light={!$stageEffectsEnabledStore} on:click={() => stageEffectsEnabledStore.set(true)}>Ja</button>
</div>

<hr />
<h1 class="title">Välj Scenlayout</h1>

<SceneSelectorControl layout={auto} {participants} selectedLayout={$stagePredefinedLayoutStore} on:select={(e) => stagePredefinedLayoutStore.set(e.detail)} />
<SceneSelectorControl layout={empty} {participants} selectedLayout={$stagePredefinedLayoutStore} on:select={(e) => stagePredefinedLayoutStore.set(e.detail)} />
<SceneSelectorControl
	layout={oneXOne}
	{participants}
	selectedLayout={$stagePredefinedLayoutStore}
	on:select={(e) => stagePredefinedLayoutStore.set(e.detail)}
/>
<SceneSelectorControl
	layout={oneXTwo}
	{participants}
	selectedLayout={$stagePredefinedLayoutStore}
	on:select={(e) => stagePredefinedLayoutStore.set(e.detail)}
/>
<SceneSelectorControl layout={chat} {participants} selectedLayout={$stagePredefinedLayoutStore} on:select={(e) => stagePredefinedLayoutStore.set(e.detail)} />
<SceneSelectorControl
	layout={twoXTwo}
	{participants}
	selectedLayout={$stagePredefinedLayoutStore}
	on:select={(e) => stagePredefinedLayoutStore.set(e.detail)}
/>
