<script lang="ts">
	import { showPeersStore } from "~/api/backstage";
	import PeerControl from "./_PeerControl.svelte";

	$: peers = Object.values($showPeersStore).filter((p) => p.name && !p.banned);
	$: managers = peers.filter((p) => p.manager);
	$: actors = peers.filter((p) => p.actor && !p.manager);
	$: visitors = peers.filter((p) => !p.manager && !p.actor && !p.banned);
	$: blocked = peers.filter((p) => p.banned && p.name);
	$: online = peers.filter((p) => p.online);

	let filter: string = "Deltagare";
</script>

<div class="radios is-size-7">
	<label class="radio">
		<input type="radio" name="filter" value="Deltagare" bind:group={filter} />
		Alla
	</label>
	{#if managers.length}
		<label class="radio has-text-link">
			<input type="radio" name="filter" value="Tekniker" bind:group={filter} />
			Tekniker
		</label>
	{/if}
	{#if actors.length}
		<label class="radio has-text-link">
			<input type="radio" name="filter" bind:group={filter} value="Skådespelare" />
			Skådespelare
		</label>
	{/if}
	<label class="radio has-text-success">
		<input type="radio" name="filter" value="Deltagare online" bind:group={filter} />
		Online
	</label>
	{#if blocked.length}
		<label class="radio has-text-danger">
			<input type="radio" name="filter" value="Blockerade deltagare" bind:group={filter} />
			Blockerade
		</label>
	{/if}
</div>

<h1
	class="title is-size-3 mt-5"
	class:has-text-info={filter == "Tekniker" || filter == "Skådespelare"}
	class:has-text-success={filter == "Deltagare online"}
	class:has-text-danger={filter == "Blockerade deltagare"}
>
	{filter}
</h1>

<div class="list">
	{#if blocked.length && filter == "Blockerade deltagare"}
		{#each blocked as peer (peer.id)}
			<PeerControl participant={peer} online={peer.online} />
		{/each}
	{:else if online.length && filter == "Deltagare online"}
		{#each online as peer (peer.id)}
			<PeerControl participant={peer} online={peer.online} />
		{/each}
	{:else}
		{#if managers.length && (filter == "Deltagare" || filter == "Tekniker")}
			{#each managers as peer (peer.id)}
				<PeerControl participant={peer} online={peer.online} />
			{/each}
		{/if}
		{#if actors.length && (filter == "Deltagare" || filter == "Skådespelare")}
			{#each actors as peer (peer.id)}
				<PeerControl participant={peer} online={peer.online} />
			{/each}
		{/if}
		{#if visitors.length && filter != "Tekniker" && filter != "Skådespelare"}
			{#each visitors as peer (peer.id)}
				<PeerControl participant={peer} online={peer.online} />
			{/each}
		{/if}
	{/if}
</div>
