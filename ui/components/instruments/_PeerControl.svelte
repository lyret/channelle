<script lang="ts">
	import type { ClientPeerAttributes } from "~/types/serverSideTypes";
	import { clickOutside } from "~/directives";
	import IconAward from "../icons/Icon-award.svelte";
	import IconBriefcase from "../icons/Icon-briefcase.svelte";
	import IconCircle from "../icons/Icon-circle.svelte";
	import IconCopy from "../icons/Icon-copy.svelte";
	import IconMonitor from "../icons/Icon-monitor.svelte";
	import IconSmartphone from "../icons/Icon-smartphone.svelte";
	import IconLock from "../icons/Icon-lock.svelte";
	import IconToggleLeft from "../icons/Icon-toggle-left.svelte";
	import IconToggleRight from "../icons/Icon-toggle-right.svelte";
	import IconType from "../icons/Icon-type.svelte";
	import IconUnlock from "../icons/Icon-unlock.svelte";
	import IconXCircle from "../icons/Icon-x-circle.svelte";
	import PeerMultimediaControls from "./_PeerMultimediaControls.svelte";
	import { updatePeer } from "~/api/peers";
	import { getPeerMediaStateStore } from "~/api/stage";

	export let peer: ClientPeerAttributes;
	export let isCurrentPeer: boolean = false;

	let loading: boolean = false;
	let active: boolean = false;

	// Get the media state store for this peer
	$: mediaStateStore = getPeerMediaStateStore(peer.id);
	$: mediaState = $mediaStateStore;

	// Action functions
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

	async function copyInviteLink(peerId: string) {
		const url = new URL(window.location.href);
		url.pathname = "/";
		url.searchParams.set("peerId", peerId);

		try {
			await navigator.clipboard.writeText(url.toString());
			alert(`Kopierade inbjudningslänken, skicka den vidare till ${mediaState?.name || peer.name}`);
		} catch (err) {
			console.error("Failed to copy invite link:", err);
		}
	}
</script>

{#if mediaState}
	<div class="list-item" use:clickOutside on:click_outside={() => (active = false)}>
		<div class="accordion-header" class:is-loading={loading}>
			<button class="button name pr-7 has-background-menu" on:click={() => (active = !active)}>
				<span
					class="icon mr-1"
					class:has-text-grey-light={!mediaState.isOnline}
					class:has-text-success={mediaState.isOnline}
					class:has-text-danger={mediaState.isBanned}
				>
					{#if mediaState.isBanned}
						<IconLock />
					{:else if mediaState.isManager}
						<IconBriefcase />
					{:else if mediaState.isActor}
						<IconAward />
					{:else}
						<IconCircle />
					{/if}
				</span>
				&nbsp;
				{mediaState.name}
				{#if isCurrentPeer}(du){/if}
				{#if peer.deviceType}
					<span class="icon ml-2 is-small" title="Enhet: {peer.deviceType}">
						{#if peer.deviceType === "mobile"}
							<IconSmartphone />
						{:else if peer.deviceType === "desktop"}
							<IconMonitor />
						{/if}
					</span>
				{/if}
			</button>
			<div class="buttons">
				{#if !CONFIG.runtime.theater}
					<PeerMultimediaControls {peer} {mediaState} {loading} {doUpdate} />
				{/if}
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
				<!-- COPY INVITE LINK -->
				{#if !CONFIG.runtime.theater && mediaState.isActor}
					<button class="dropdown-item" on:click={() => copyInviteLink(peer.id)}>
						<span class="icon is-small"><IconCopy /></span> Kopiera skådespelarens inbjudningslänk
					</button>
				{/if}
				<!-- MAKE ACTOR -->
				{#if mediaState.isActor && !mediaState.isManager}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<a
						class="dropdown-item"
						on:click={() => doUpdate(peer, { actor: false, manager: false }, `Ta bort "${mediaState.name}" som skådespelare?`)}
					>
						<span class="icon is-small"><IconXCircle /></span>
						Inte en skådespelare
					</a>
				{:else if !mediaState.isManager}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<a class="dropdown-item" on:click={() => doUpdate(peer, { actor: true }, `Är "${mediaState.name}" en skådespelare?`)}>
						<span class="icon is-small"><IconAward /></span>
						Gör till skådespelare
					</a>
				{/if}
				<!-- MAKE TECHNICAN -->
				{#if mediaState.isManager}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<a class="dropdown-item" on:click={() => doUpdate(peer, { manager: false }, `Ta bort "${mediaState.name}" som tekniker?`)}>
						<span class="icon is-small"><IconXCircle /></span> Inte en tekniker</a
					>
				{:else}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-missing-attribute -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<a class="dropdown-item" on:click={() => doUpdate(peer, { manager: true, actor: true }, `Är "${mediaState.name}" en tekniker?`)}>
						<span class="icon is-small"><IconBriefcase /></span> Gör till tekniker</a
					>
				{/if}
				<!-- CHANGE NAME -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-missing-attribute -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<a class="dropdown-item" on:click={() => changeName(peer)}> <span class="icon is-small"><IconType /></span> Byt namn</a>
				<!-- BLOCK -->
				{#if mediaState.isBanned}
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
					<a class="dropdown-item" on:click={() => doUpdate(peer, { banned: true }, `Vill du blockera och ta bort "${mediaState.name}"?`)}>
						<span class="icon is-small"><IconLock /></span> Blockera person
					</a>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.icon.is-small {
		font-size: 0.6em;
	}
	.has-background-menu {
		background: unset !important;
	}

	.button.name {
		text-align: left;
		justify-content: flex-start;
	}

	/* Media control button styles */
	.buttons .button {
		position: relative;
	}

	/* Success state - actively transmitting */
	.buttons .button.is-success {
		background-color: #48c774;
		color: white;
		border-color: #48c774;
	}
	.buttons .button.is-success:hover:not(:disabled) {
		background-color: #3abb67;
	}

	/* Warning state - active but not transmitting */
	.buttons .button.is-warning {
		background-color: #ffdd57;
		color: rgba(0, 0, 0, 0.7);
		border-color: #ffdd57;
	}
	.buttons .button.is-warning:hover:not(:disabled) {
		background-color: #ffd83d;
	}

	/* Light state - muted */
	.buttons .button.is-light {
		background-color: #f5f5f5;
		color: #363636;
		border: 1px solid #dbdbdb;
	}
	.buttons .button.is-light:hover:not(:disabled) {
		background-color: #eeeeee;
		border-color: #b5b5b5;
	}

	/* Info state - allowed but not active */
	.buttons .button.is-info {
		background-color: #3298dc;
		color: white;
		border-color: #3298dc;
	}
	.buttons .button.is-info:hover:not(:disabled) {
		background-color: #2793da;
	}
	.buttons .button.is-info .icon {
		color: white;
	}

	/* Disabled state */
	.buttons .button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Icon color adjustments */
	.buttons .button.is-success .icon {
		color: white;
	}
	.buttons .button.is-warning .icon {
		color: rgba(0, 0, 0, 0.7);
	}

	/* Layout styles */
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
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: inherit;
		color: inherit;
		padding: 0;
	}

	.accordion-header .name:hover {
		text-decoration: underline;
	}

	.accordion-content {
		flex-basis: 1;
		width: 100%;
	}

	.accordion-content a:hover {
		color: white;
	}
</style>
