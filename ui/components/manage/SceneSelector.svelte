<script lang="ts">
	import { createDatabaseStore } from '~/stores';
	import { createMediaLayoutStore } from '~/stores/media';
	import ParticipantSelect from './ParticipantSelect.svelte';
	import type { MediaLayout } from '~/api';

	let layout = createMediaLayoutStore();
	let allParticipants = createDatabaseStore('participant');
	$: actors = $allParticipants.filter((p) => p.actor);

	let chat1: number = -1;
	let chat2: number = -1;
	let onexone1: number = -1;
	let twoxtwo1: number = -1;
	let twoxtwo2: number = -1;
	let twoxtwo3: number = -1;
	let twoxtwo4: number = -1;

	function updateLayout(update: Partial<Omit<MediaLayout, 'name' | 'layout'>>) {
		setTimeout(
			() =>
				layout.set({
					...$layout,
					...update,
				}),
			100
		);
	}
	function selectChat() {
		setTimeout(
			() =>
				layout.set({
					name: 'chatfocus',
					allowChat: true,
					layout: [
						[
							{ type: 'actor', id: chat1 },
							{ type: 'chat' },
							{ type: 'actor', id: chat2 },
						],
					],
				}),
			100
		);
	}
	function selectOneXOne() {
		setTimeout(
			() =>
				layout.set({
					name: '1x1',
					allowChat: false,
					layout: [[{ type: 'actor', id: onexone1 }]],
				}),
			100
		);
	}
	function selectTwoXTwo() {
		setTimeout(
			() =>
				layout.set({
					name: '2x2',
					allowChat: false,
					layout: [
						[
							{ type: 'actor', id: twoxtwo1 },
							{ type: 'actor', id: twoxtwo2 },
						],
						[
							{ type: 'actor', id: twoxtwo3 },
							{ type: 'actor', id: twoxtwo4 },
						],
					],
				}),
			100
		);
	}
</script>

<h1 class="title">Sceninställningar</h1>
<button
	class="button is-dark is-fullwidth"
	class:is-success={$layout.curtains}
	on:click={() => updateLayout({ curtains: !$layout.curtains })}
	>Visa ridå</button
>
<button
	class="button is-dark is-fullwidth"
	class:is-success={$layout.allowVisitorAudio}
	on:click={() =>
		updateLayout({ allowVisitorAudio: !$layout.allowVisitorAudio })}
	>Tillåt ljud från publiken</button
>
<hr />
<h1 class="title">Välj Scenlayout</h1>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-1-cols notification is-secondary is-dark"
	class:is-success={$layout.name == '1x1'}
	on:click={() => selectOneXOne()}
>
	<h2 class="subtitle" class:has-text-white={$layout.name != '1x1'}>1x1</h2>
	<div class="grid">
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={onexone1}
				on:change={() => $layout.name == '1x1' && selectOneXOne()}
			/>
		</div>
	</div>
</div>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-3-cols notification is-secondary is-dark"
	class:is-success={$layout.name == 'chatfocus'}
	on:click={() => selectChat()}
>
	<h2 class="subtitle" class:has-text-white={$layout.name != 'chatfocus'}>
		Chattfokus
	</h2>
	<div class="grid">
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={chat1}
				on:change={() => $layout.name == 'chatfocus' && selectChat()}
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
				on:change={() => $layout.name == 'chatfocus' && selectChat()}
			/>
		</div>
	</div>
</div>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-2-cols notification is-secondary is-dark"
	class:is-success={$layout.name == '2x2'}
	on:click={() => selectTwoXTwo()}
>
	<h2 class="subtitle" class:has-text-white={$layout.name != '2x2'}>2x2</h2>
	<div class="grid">
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo1}
				on:change={() => $layout.name == '2x2' && selectTwoXTwo()}
			/>
		</div>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo2}
				on:change={() => $layout.name == '2x2' && selectTwoXTwo()}
			/>
		</div>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo3}
				on:change={() => $layout.name == '2x2' && selectTwoXTwo()}
			/>
		</div>
		<div class="cell">
			<ParticipantSelect
				participants={actors}
				bind:value={twoxtwo4}
				on:change={() => $layout.name == '2x2' && selectTwoXTwo()}
			/>
		</div>
	</div>
</div>
