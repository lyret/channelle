<script lang="ts">
	import { createDatabaseStore } from '~/stores';
	import ParticipantSelect from './ParticipantSelect.svelte';

	import { sceneLayout } from '~/stores/scene/sceneLayout';
	import { sceneCurtains } from '~/stores/scene/sceneCurtains';
	import { sceneVisitorAudioIsEnabled } from '~/stores/scene/sceneVisitorAudioIsEnabled';
	import { sceneEffectsIsEnabled } from '~/stores/scene/sceneEffectsIsEnabled';
	import { sceneChatIsEnabled } from '~/stores/scene/sceneChatIsEnabled';

	let selectedLayout = '';

	let allParticipants = createDatabaseStore('participant');
	$: actors = $allParticipants.filter((p) => p.actor);

	let chat1: number = -1;
	let chat2: number = -1;
	let onexone1: number = -1;
	let twoxtwo1: number = -1;
	let twoxtwo2: number = -1;
	let twoxtwo3: number = -1;
	let twoxtwo4: number = -1;

	function selectChat() {
		selectedLayout = 'chatfocus';
		sceneChatIsEnabled.set(true);
		sceneLayout.set([
			[
				{ type: 'actor', id: chat1 },
				{ type: 'chat' },
				{ type: 'actor', id: chat2 },
			],
		]);
	}
	function selectOneXOne() {
		selectedLayout = '1x1';
		sceneChatIsEnabled.set(false);
		sceneLayout.set([[{ type: 'actor', id: onexone1 }]]);
	}
	function selectTwoXTwo() {
		selectedLayout = '2x2';
		sceneChatIsEnabled.set(false);
		sceneLayout.set([
			[
				{ type: 'actor', id: twoxtwo1 },
				{ type: 'actor', id: twoxtwo2 },
			],
			[
				{ type: 'actor', id: twoxtwo3 },
				{ type: 'actor', id: twoxtwo4 },
			],
		]);
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

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-1-cols notification is-secondary is-dark"
	class:is-success={selectedLayout == '1x1'}
	on:click={() => selectOneXOne()}
>
	<h2 class="subtitle" class:has-text-white={selectedLayout != '1x1'}>1x1</h2>
	<div class="grid">
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={onexone1}
				on:change={() => selectedLayout == '1x1' && selectOneXOne()}
			/>
		</div>
	</div>
</div>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-3-cols notification is-secondary is-dark"
	class:is-success={selectedLayout == 'chatfocus'}
	on:click={() => selectChat()}
>
	<h2 class="subtitle" class:has-text-white={selectedLayout != 'chatfocus'}>
		Chattfokus
	</h2>
	<div class="grid">
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={chat1}
				on:change={() => selectedLayout == 'chatfocus' && selectChat()}
			/>
		</div>
		<button disabled class="button">
			<span class="icon"><ion-icon name="chatbox-ellipses"></ion-icon></span>
			<span>Chatt</span></button
		>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={chat2}
				on:change={() => selectedLayout == 'chatfocus' && selectChat()}
			/>
		</div>
	</div>
</div>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-2-cols notification is-secondary is-dark"
	class:is-success={selectedLayout == '2x2'}
	on:click={() => selectTwoXTwo()}
>
	<h2 class="subtitle" class:has-text-white={selectedLayout != '2x2'}>2x2</h2>
	<div class="grid">
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo1}
				on:change={() => selectedLayout == '2x2' && selectTwoXTwo()}
			/>
		</div>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo2}
				on:change={() => selectedLayout == '2x2' && selectTwoXTwo()}
			/>
		</div>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo3}
				on:change={() => selectedLayout == '2x2' && selectTwoXTwo()}
			/>
		</div>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo4}
				on:change={() => selectedLayout == '2x2' && selectTwoXTwo()}
			/>
		</div>
	</div>
</div>
