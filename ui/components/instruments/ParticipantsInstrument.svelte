<script lang="ts">
	import { showPeersStore, currentPeerStore } from "~/api";
	import { createPeer } from "~/api/peers";
	import PeerControl from "./_PeerControl.svelte";
	import PicolPlus from "../picol/icons/Picol-plus.svelte";

	$: peers = Object.values($showPeersStore).filter((p) => p.name && !p.banned);
	$: managers = peers.filter((p) => p.manager);
	$: actors = peers.filter((p) => p.actor && !p.manager);
	$: visitors = peers.filter((p) => !p.manager && !p.actor && !p.banned);
	$: blocked = peers.filter((p) => p.banned && p.name);
	$: online = peers.filter((p) => p.online);

	let filter: string = "Deltagare online";
	let createError = "";

	async function handleCreateActor() {
		const newPeerName = prompt("Ange namn för ny skådespelare:");

		if (!newPeerName || !newPeerName.trim()) {
			return;
		}

		createError = "";

		const result = await createPeer(newPeerName.trim(), true, false);

		if (result.success) {
			// The new peer will appear automatically via the subscription
		} else {
			createError = result.error || "Kunde inte skapa skådespelare";
		}
	}
</script>

<div class="radios is-size-7">
	<label class="radio has-text-success">
		<input type="radio" name="filter" value="Deltagare online" bind:group={filter} />
		Online
	</label>
	<label class="radio has-text-link">
		<input type="radio" name="filter" bind:group={filter} value="Skådespelare" />
		Skådespelare
	</label>
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

{#if filter == "Skådespelare"}
	<div class="mb-4">
		<button class="button is-small is-info" on:click={handleCreateActor}>
			<span class="icon is-small">
				<PicolPlus />
			</span>
			<span>Lägg till skådespelare</span>
		</button>
	</div>
	{#if createError}
		<div class="notification is-danger is-light is-small mb-4">
			{createError}
		</div>
	{/if}
{/if}

<div class="list">
	{#if blocked.length && filter == "Blockerade deltagare"}
		{#each blocked as peer (peer.id)}
			<PeerControl {peer} isCurrentPeer={peer.id == $currentPeerStore.id} />
		{/each}
	{:else if online.length && filter == "Deltagare online"}
		{#each online as peer (peer.id)}
			<PeerControl {peer} isCurrentPeer={peer.id == $currentPeerStore.id} />
		{/each}
	{:else}
		{#if managers.length && (filter == "Deltagare" || filter == "Tekniker")}
			{#each managers as peer (peer.id)}
				<PeerControl {peer} isCurrentPeer={peer.id == $currentPeerStore.id} />
			{/each}
		{/if}
		{#if actors.length && (filter == "Deltagare" || filter == "Skådespelare")}
			{#each actors as peer (peer.id)}
				<PeerControl {peer} isCurrentPeer={peer.id == $currentPeerStore.id} />
			{/each}
		{/if}
		{#if visitors.length && filter != "Tekniker" && filter != "Skådespelare"}
			{#each visitors as peer (peer.id)}
				<PeerControl {peer} isCurrentPeer={peer.id == $currentPeerStore.id} />
			{/each}
		{/if}
	{/if}
</div>
