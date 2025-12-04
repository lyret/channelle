<script lang="ts">
	import type { ClientPeerAttributes } from "~/types/serverSideTypes";
	import { clickOutside } from "~/directives";
	import IconAward from "../icons/Icon-award.svelte";
	import IconBriefcase from "../icons/Icon-briefcase.svelte";
	import IconCircle from "../icons/Icon-circle.svelte";
	import IconCopy from "../icons/Icon-copy.svelte";
	import IconLock from "../icons/Icon-lock.svelte";
	import IconMic from "../icons/Icon-mic.svelte";
	import IconMicOff from "../icons/Icon-mic-off.svelte";
	import IconToggleLeft from "../icons/Icon-toggle-left.svelte";
	import IconToggleRight from "../icons/Icon-toggle-right.svelte";
	import IconType from "../icons/Icon-type.svelte";
	import IconUnlock from "../icons/Icon-unlock.svelte";
	import IconVideo from "../icons/Icon-video.svelte";
	import IconVideoOff from "../icons/Icon-camera-off.svelte";
	import IconXCircle from "../icons/Icon-x-circle.svelte";
	import { updatePeer } from "~/api/peers";
	import { getPeerMediaStateStore } from "~/api/stageNew/peerMedia";

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
			<button class="button name pr-7" class:is-strikethrough={mediaState.isBanned} on:click={() => (active = !active)}>
				<span class="icon mr-1" class:has-text-grey-light={!mediaState.isOnline} class:has-text-success={mediaState.isOnline}>
					{#if mediaState.isManager}
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
			</button>
			<div class="buttons">
				{#if mediaState.isActor || mediaState.isManager}
					<button
						class="button is-small"
						class:is-light={mediaState.videoMuted ||
							(!mediaState.isCurrentPeer && !mediaState.isReceivingVideo && !mediaState.isTransmittingVideo) ||
							(mediaState.isCurrentPeer && !mediaState.videoAllowed && !mediaState.hasLocalVideoTrack)}
						class:is-success={(mediaState.isCurrentPeer && !mediaState.videoMuted && mediaState.hasLocalVideoTrack) ||
							(!mediaState.isCurrentPeer && !mediaState.videoMuted && mediaState.isReceivingVideo)}
						class:is-info={mediaState.isCurrentPeer && !mediaState.videoMuted && mediaState.videoAllowed && !mediaState.hasLocalVideoTrack}
						class:is-warning={!mediaState.isCurrentPeer && !mediaState.videoMuted && mediaState.isTransmittingVideo && !mediaState.isReceivingVideo}
						disabled={loading || !mediaState.videoAllowed}
						title={mediaState.videoMuted
							? "Video avstängd - klicka för att sätta på"
							: mediaState.isCurrentPeer
								? !mediaState.videoAllowed
									? "Video ej tillåten i denna scen"
									: mediaState.hasLocalVideoTrack
										? mediaState.isTransmittingVideo
											? "Video aktiv och sänds"
											: "Video aktiv (lokal)"
										: "Video tillåten men inte aktiv"
								: mediaState.isReceivingVideo
									? "Video tas emot"
									: mediaState.isTransmittingVideo
										? "Video sänds men tas ej emot här"
										: "Video inte aktiv"}
						on:click={() => doUpdate(peer, { videoMuted: !mediaState.videoMuted })}
					>
						<span class="icon">
							{#if mediaState.videoMuted}
								<IconVideoOff />
							{:else}
								<IconVideo />
							{/if}
						</span>
					</button>
				{/if}
				<button
					class="button is-small"
					class:is-light={mediaState.audioMuted ||
						(!mediaState.isCurrentPeer && !mediaState.isReceivingAudio && !mediaState.isTransmittingAudio) ||
						(mediaState.isCurrentPeer && !mediaState.audioAllowed && !mediaState.hasLocalAudioTrack)}
					class:is-success={(mediaState.isCurrentPeer && !mediaState.audioMuted && mediaState.hasLocalAudioTrack) ||
						(!mediaState.isCurrentPeer && !mediaState.audioMuted && mediaState.isReceivingAudio)}
					class:is-info={mediaState.isCurrentPeer && !mediaState.audioMuted && mediaState.audioAllowed && !mediaState.hasLocalAudioTrack}
					class:is-warning={!mediaState.isCurrentPeer && !mediaState.audioMuted && mediaState.isTransmittingAudio && !mediaState.isReceivingAudio}
					disabled={loading || !mediaState.audioAllowed}
					title={mediaState.audioMuted
						? "Ljud avstängt - klicka för att sätta på"
						: mediaState.isCurrentPeer
							? !mediaState.audioAllowed
								? "Ljud ej tillåtet i denna scen"
								: mediaState.hasLocalAudioTrack
									? mediaState.isTransmittingAudio
										? "Ljud aktivt och sänds"
										: "Ljud aktivt (lokal)"
									: "Ljud tillåtet men inte aktivt"
							: mediaState.isReceivingAudio
								? "Ljud tas emot"
								: mediaState.isTransmittingAudio
									? "Ljud sänds men tas ej emot här"
									: "Ljud inte aktivt"}
					on:click={() => doUpdate(peer, { audioMuted: !mediaState.audioMuted })}
				>
					<span class="icon">
						{#if mediaState.audioMuted}
							<IconMicOff />
						{:else}
							<IconMic />
						{/if}
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
				<!-- COPY INVITE LINK -->
				{#if !CONFIG.runtime.theater}
					<button class="dropdown-item" on:click={() => copyInviteLink(peer.id)}>
						<span class="icon is-small"><IconCopy /></span> Kopiera inbjudningslänk
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
