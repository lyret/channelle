<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DataTypes } from '~/lib';
	import type { PredefinedLayout } from '~/stores/stage/selectedPredefinedStageLayout';
	const dispatch = createEventDispatcher();

	export let selectedLayout: any;
	export let participants: Array<DataTypes['participant']>;
	export let layout: PredefinedLayout;

	$: selected = selectedLayout?.name == layout.name;

	function onChange(e: any, cell: any) {
		e.stopPropagation();
		cell.id = (e.target as any).value;
		dispatch('update', layout);
		if (selected) {
			dispatch('select', layout);
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-{layout?.layout[0] &&
		layout.layout[0].length}-cols notification is-secondary is-dark"
	class:is-success={selected}
	on:click={() => dispatch('select', layout)}
>
	<h2 class="subtitle mb-1 is-6" class:has-text-white={!selected}>
		{layout.name}
	</h2>
	<div class="grid">
		{#each layout.layout as row}
			{#each row as cell}
				<div class="cell">
					{#if cell.type == 'empty'}
						<button disabled class="button is-fullwidth">
							<span class="icon"><ion-icon name="user"></ion-icon></span>
							<span> - Ingen - </span></button
						>
					{:else if cell.type == 'chat'}
						<button disabled class="button is-fullwidth">
							<span class="icon"
								><ion-icon name="chatbox-ellipses"></ion-icon></span
							>
							<span>Chatt</span></button
						>{:else if cell.type == 'actor'}
						<div class="select is-fullwidth">
							<select
								on:change={(e) => onChange(e, cell)}
								on:click={(e) => e.stopPropagation()}
							>
								<option value={-1} class="has-text-gray">- Ingen -</option>
								{#each participants as participant}
									<option value={participant.id}>{participant.name}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>
