<script lang="ts">
	import { createDatabaseStore } from '~/stores';
	import SceneSelectorControl from './SceneSelectorControl.svelte';

	import { sceneLayout, type SceneLayout } from '~/stores/scene/sceneLayout';
	import { sceneCurtains } from '~/stores/scene/sceneCurtains';
	import { sceneVisitorAudioIsEnabled } from '~/stores/scene/sceneVisitorAudioIsEnabled';
	import { sceneEffectsIsEnabled } from '~/stores/scene/sceneEffectsIsEnabled';
	import { sceneChatIsEnabled } from '~/stores/scene/sceneChatIsEnabled';
	import { onMount } from 'svelte';

	let allParticipants = createDatabaseStore('participant');
	$: participants = $allParticipants.filter(
		(p) => (p.actor || p.manager) && !p.blocked
	);

	type PredefinedLayout = {
		name: string;
		chatEnabled: boolean;
		layout: SceneLayout;
	};

	let selectedLayout: PredefinedLayout | undefined = undefined;

	let auto: PredefinedLayout = {
		name: 'Automatisk',
		chatEnabled: true,
		layout: [],
	};
	let empty: PredefinedLayout = {
		name: 'Helt tom',
		chatEnabled: false,
		layout: [[{ type: 'empty' }]],
	};
	let chat: PredefinedLayout = {
		name: 'Chatduell',
		chatEnabled: true,
		layout: [
			[{ type: 'actor', id: -1 }, { type: 'chat' }, { type: 'actor', id: -1 }],
		],
	};
	let oneXOne: PredefinedLayout = {
		name: 'En i fokus',
		chatEnabled: false,
		layout: [[{ type: 'actor', id: -1 }]],
	};
	let twoXTwo: PredefinedLayout = {
		name: 'Fyra rutor',
		chatEnabled: false,
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

	function selectLayout(layout: PredefinedLayout) {
		selectedLayout = layout;
		sceneChatIsEnabled.set(selectedLayout.chatEnabled);
		sceneLayout.set(selectedLayout.layout);
	}
</script>

<h1 class="title">Sceninställningar</h1>
<button
	class="button is-dark is-fullwidth"
	class:is-success={$sceneCurtains}
	on:click={() => sceneCurtains.set(!$sceneCurtains)}>Visa ridå</button
>
<button
	class="button is-dark is-fullwidth"
	class:is-success={$sceneVisitorAudioIsEnabled}
	on:click={() => {
		sceneVisitorAudioIsEnabled.set(!$sceneVisitorAudioIsEnabled);
	}}>Tillåt ljud från publiken</button
>
<button
	class="button is-dark is-fullwidth"
	class:is-success={$sceneEffectsIsEnabled}
	on:click={() => {
		sceneEffectsIsEnabled.set(!$sceneEffectsIsEnabled);
	}}>Tillåt blommor och applåder</button
>
<hr />
<h1 class="title">Välj Scenlayout</h1>

<SceneSelectorControl
	layout={auto}
	{participants}
	{selectedLayout}
	on:select={(e) => selectLayout(e.detail)}
/>
<SceneSelectorControl
	layout={empty}
	{participants}
	{selectedLayout}
	on:select={(e) => selectLayout(e.detail)}
/>
<SceneSelectorControl
	layout={oneXOne}
	{participants}
	{selectedLayout}
	on:select={(e) => selectLayout(e.detail)}
/>
<SceneSelectorControl
	layout={chat}
	{participants}
	{selectedLayout}
	on:select={(e) => selectLayout(e.detail)}
/>
<SceneSelectorControl
	layout={twoXTwo}
	{participants}
	{selectedLayout}
	on:select={(e) => selectLayout(e.detail)}
/>
