<script lang="ts">
	import { createDatabaseStore } from '~/stores';
	import SceneSelectorControl from './SceneSelectorControl.svelte';

	import { onMount } from 'svelte';
	import { sceneChatIsEnabled } from '~/stores/scene/sceneChatIsEnabled';
	import { sceneCurtains } from '~/stores/scene/sceneCurtains';
	import { sceneEffectsIsEnabled } from '~/stores/scene/sceneEffectsIsEnabled';
	import { sceneVisitorAudioIsEnabled } from '~/stores/scene/sceneVisitorAudioIsEnabled';
	import {
		selectedPredefinedStageLayout,
		type PredefinedLayout,
	} from '~/stores/stage/selectedPredefinedStageLayout';
	import { stageLayout } from '~/stores/stage/stageLayout';

	const allParticipants = createDatabaseStore('participant');
	$: participants = $allParticipants.filter(
		(p) => (p.actor || p.manager) && !p.blocked
	);

	const auto: PredefinedLayout = {
		name: 'Automatisk',
		chatEnabled: true,
		layout: [],
	};
	const empty: PredefinedLayout = {
		name: 'Helt tom',
		chatEnabled: true,
		layout: [[{ type: 'empty' }]],
	};
	const chat: PredefinedLayout = {
		name: 'Chatduell',
		chatEnabled: false,
		layout: [
			[{ type: 'actor', id: -1 }, { type: 'chat' }, { type: 'actor', id: -1 }],
		],
	};
	const oneXOne: PredefinedLayout = {
		name: 'En i fokus',
		chatEnabled: true,
		layout: [[{ type: 'actor', id: -1 }]],
	};
	const oneXTwo: PredefinedLayout = {
		name: 'Två bredvid varandra',
		chatEnabled: true,
		layout: [
			[
				{ type: 'actor', id: -1 },
				{ type: 'actor', id: -1 },
			],
		],
	};
	const twoXTwo: PredefinedLayout = {
		name: 'Fyra rutor',
		chatEnabled: true,
		layout: [
			[
				{ type: 'actor', id: -1 },
				{ type: 'actor', id: -1 },
			],
			[
				{ type: 'actor', id: -1 },
				{ type: 'actor', id: -1 },
			],
		],
	};

	// Sync actual stage layout stores when the selected predefined layout changes
	onMount(() => {
		const stop = selectedPredefinedStageLayout.subscribe((layout) => {
			if (layout) {
				sceneChatIsEnabled.set(layout?.chatEnabled || false);
			}
			stageLayout.set(layout?.layout || []);
		});

		return () => {
			stop();
		};
	});
</script>

<h1 class="title">Sceninställningar</h1>

<h1 class="title is-4">Tvingade inställningar</h1>
<p class="subtitle is-6">Dessa inställningar kommer gälla oavsett vilken scen som pågår.</p>

<!-- Scene curtains -->
<p class="has-text-centered pb-2 mt-2">Visa ridån 🎭</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$sceneCurtains} on:click={() =>  $sceneCurtains = false}>Dölj</button>
	<button class="button is-info" class:is-light={$sceneCurtains} >Automatiskt</button>
	<button class="button is-success" class:is-light={!$sceneCurtains} on:click={() =>  $sceneCurtains = true}>Visa</button>
  </div>

<!-- Chat button -->
<p class="has-text-centered pb-2 mt-2">Visa chatt-panelen 💬</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$sceneChatIsEnabled} on:click={() =>  $sceneChatIsEnabled = false}>Dölj</button>
	<button class="button is-info" class:is-light={$sceneChatIsEnabled} >Automatiskt</button>
	<button class="button is-success" class:is-light={!$sceneChatIsEnabled} on:click={() =>  $sceneChatIsEnabled = true}>Visa</button>
  </div>

<!-- Visitor audio -->
<p class="has-text-centered pb-2 mt-2">Tillåt ljud från publiken 🎤</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$sceneVisitorAudioIsEnabled} on:click={() =>  $sceneVisitorAudioIsEnabled = false}>Nej</button>
	<button class="button is-info" class:is-light={$sceneVisitorAudioIsEnabled} >Automatiskt</button>
	<button class="button is-success" class:is-light={!$sceneVisitorAudioIsEnabled} on:click={() =>  $sceneVisitorAudioIsEnabled = true}>Ja</button>
  </div>

<!-- Visitor effects -->
<p class="has-text-centered pb-2 mt-2">Tillåt blommor och applåder 🌹👏</p>
<div class="buttons has-addons is-centered">
	<button class="button is-danger" class:is-light={$sceneEffectsIsEnabled} on:click={() =>  $sceneEffectsIsEnabled = false}>Nej</button>
	<button class="button is-info" class:is-light={$sceneEffectsIsEnabled} >Automatiskt</button>
	<button class="button is-success" class:is-light={!$sceneEffectsIsEnabled} on:click={() =>  $sceneEffectsIsEnabled = true}>Ja</button>
  </div>

<hr />
<h1 class="title">Välj Scenlayout</h1>

<SceneSelectorControl
	layout={auto}
	{participants}
	selectedLayout={$selectedPredefinedStageLayout}
	on:select={(e) => selectedPredefinedStageLayout.set(e.detail)}
/>
<SceneSelectorControl
	layout={empty}
	{participants}
	selectedLayout={$selectedPredefinedStageLayout}
	on:select={(e) => selectedPredefinedStageLayout.set(e.detail)}
/>
<SceneSelectorControl
	layout={oneXOne}
	{participants}
	selectedLayout={$selectedPredefinedStageLayout}
	on:select={(e) => selectedPredefinedStageLayout.set(e.detail)}
/>
<SceneSelectorControl
	layout={oneXTwo}
	{participants}
	selectedLayout={$selectedPredefinedStageLayout}
	on:select={(e) => selectedPredefinedStageLayout.set(e.detail)}
/>
<SceneSelectorControl
	layout={chat}
	{participants}
	selectedLayout={$selectedPredefinedStageLayout}
	on:select={(e) => selectedPredefinedStageLayout.set(e.detail)}
/>
<SceneSelectorControl
	layout={twoXTwo}
	{participants}
	selectedLayout={$selectedPredefinedStageLayout}
	on:select={(e) => selectedPredefinedStageLayout.set(e.detail)}
/>
