<script lang="ts">
	import type { ClientPeerAttributes } from "~/types/serverSideTypes";
	import { clickOutside } from "~/directives";
	import IconAward from "../icons/Icon-award.svelte";
	import IconBriefcase from "../icons/Icon-briefcase.svelte";
	import IconCircle from "../icons/Icon-circle.svelte";
	import IconLock from "../icons/Icon-lock.svelte";
	import IconMic from "../icons/Icon-mic.svelte";
	import IconToggleLeft from "../icons/Icon-toggle-left.svelte";
	import IconToggleRight from "../icons/Icon-toggle-right.svelte";
	import IconType from "../icons/Icon-type.svelte";
	import IconUnlock from "../icons/Icon-unlock.svelte";
	import IconVideo from "../icons/Icon-video.svelte";
	import IconXCircle from "../icons/Icon-x-circle.svelte";
	import { updatePeer } from "~/api/peers";

	export let peer: ClientPeerAttributes;
	export let isCurrentPeer: boolean = false;
	let loading: boolean = false;
	let active: boolean = false;

	async function doUpdate(participant: any, data: any, ask?: string) {
		loading = true;
		if (!ask || confirm(ask)) {
			await updatePeer(participant.id, data);
		}
		loading = false;
	}

	async function changeName(participant: any) {
		loading = true;
		const newName = prompt("Skriv nytt namn", participant.name);
		if (newName && newName !== participant.name) {
			await updatePeer(participant.id, { name: newName });
		}
		loading = false;
	}
</script>

<div class="list-item" use:clickOutside on:click_outside={() => (active = false)}>
	<div class="accordion-header" class:is-loading={loading}>
		<div class="icon" class:has-text-grey-light={!peer.online} class:has-text-success={peer.online}>
			{#if peer.manager}
				<IconBriefcase />
			{:else if peer.actor}
				<IconAward />
			{:else}
				<IconCircle />
			{/if}
		</div>
		&nbsp;
		<div class="name pr-7" class:is-strikethrough={peer.banned}>
			{peer.name}
			{#if isCurrentPeer}(du){/if}
		</div>
		<div class="buttons">
			{#if peer.manager || peer.actor}
				<button class="button is-small" disabled title="Video control not implemented">
					<span class="icon">
						<IconVideo />
					</span>
				</button>
			{/if}
			<button class="button is-small" disabled title="Audio control not implemented">
				<span class="icon">
					<IconMic />
				</span>
			</button>
			<button class="button is-small" on:click={() => (active = !active)}>
				<span class="icon">
					{#if active}
						<IconToggleRight />
					{:else}
						<IconToggleLeft />
					{/if}
				</span>
			</button>
		</div>
	</div>
	{#if active}
		<div class="accordion-content">
			<!-- MAKE ACTOR -->
			{#if peer.actor && !peer.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => doUpdate(peer, { actor: false, manager: false }, `Ta bort "${peer.name}" som skådespelare?`)}>
					<span class="icon"><IconXCircle /> Inte en skådespelare </span></a
				>
			{:else if !peer.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => doUpdate(peer, { actor: true }, `Är "${peer.name}" en skådespelare?`)}>
					<span class="icon is-small"><IconAward /></span>
					Gör till skådespelare
				</a>
			{/if}
			<!-- MAKE TECHNICAN -->
			{#if peer.manager}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => doUpdate(peer, { manager: false }, `Ta bort "${peer.name}" som tekniker?`)}>
					<span class="icon is-small"><IconXCircle /></span> Inte en tekniker</a
				>
			{:else}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => doUpdate(peer, { manager: true, actor: true }, `Är "${peer.name}" en tekniker?`)}>
					<span class="icon is-small"><IconBriefcase /></span> Gör till tekniker</a
				>
			{/if}
			<!-- CHANGE NAME -->
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-missing-attribute -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<a class="dropdown-item" on:click={() => changeName(peer)}> <span class="icon is-small"><IconType /></span> Byt namn</a>
			<!-- BLOCK -->
			{#if peer.banned}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => doUpdate(peer, { banned: false })}>
					<span class="icon is-small"><IconUnlock /></span> Tillåt tillbaka
				</a>
			{:else}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => doUpdate(peer, { banned: true }, `Vill du blockera och ta bort "${peer.name}"?`)}>
					<span class="icon is-small"><IconLock /></span> Blockera person
				</a>
			{/if}
		</div>
	{/if}
</div>

<style>
	.list-item {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-items: start;
		justify-content: start;
		align-items: start;
		align-content: start;
	}
	.accordion-header {
		width: 100%;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-items: start;
		justify-content: start;
		align-items: start;
		align-content: start;
	}
	.accordion-header div {
		display: block;
		flex-grow: 0;
		flex-shrink: 1;
		flex-basis: auto;
		align-self: auto;
		order: 0;
	}
	.accordion-header .name {
		flex-grow: 1;
	}

	.accordion-content {
		flex-basis: 1;
		width: 100%;
	}

	.accordion-content a:hover {
		color: white;
	}
</style>
