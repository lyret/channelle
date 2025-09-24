<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import IconMessageCircle from "../icons/Icon-message-circle.svelte";
	import IconUser from "../icons/Icon-user.svelte";
	import type { Peer, Scene } from "~/types/serverSideTypes";
	const dispatch = createEventDispatcher<{ update: Scene; select: Scene }>();

	export let selectedLayout: Scene | undefined;
	export let peers: Array<Peer>;
	export let layout: Scene;

	$: selected = selectedLayout?.name == layout.name;

	function onChange(e: any, cell: any) {
		e.stopPropagation();
		cell.id = (e.target as any).value;
		dispatch("update", layout);
		if (selected) {
			dispatch("select", layout);
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="fixed-grid has-{layout?.layout[0] && layout.layout[0].length}-cols notification is-secondary is-dark"
	class:is-primary={selected}
	on:click={() => dispatch("select", layout)}
>
	<h2 class="subtitle mb-1 is-6" class:has-text-white={!selected}>
		{layout.name}
	</h2>
	<div class="grid">
		{#each layout.layout as row, rowIndex (rowIndex)}
			{#each row as cell, cellIndex (`${rowIndex}-${cellIndex}`)}
				<div class="cell">
					{#if cell.type == "empty"}
						<button disabled class="button is-fullwidth">
							<span class="icon"><IconUser /></span>
							<span> - Ingen - </span></button
						>
					{:else if cell.type == "chat"}
						<button disabled class="button is-fullwidth">
							<span class="icon"><IconMessageCircle /></span>
							<span>Chatt</span></button
						>{:else if cell.type == "actor"}
						<div class="select is-fullwidth">
							<select on:change={(e) => onChange(e, cell)} on:click={(e) => e.stopPropagation()}>
								<option value={-1} class="has-text-gray">- Ingen -</option>
								{#each peers as peer (peer.id)}
									<option value={peer.id}>{peer.name}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>
