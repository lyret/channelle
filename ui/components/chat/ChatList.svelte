<script lang="ts">
	import { onMount } from "svelte";
	import { blur } from "svelte/transition";
	import { remove } from "~/lib";
	import { currentParticipant } from "~/lib/stores/api";
	import { createDatabaseStore } from "~/stores";
	import PicoBadgeMinus from "../picol/icons/Picol-badge-minus.svelte";

	export let backstageOnly: boolean = false;

	let ref: HTMLDivElement;
	let loaded = false;
	let hasUnread = false;
	let scrollPositionBackstage = -1;
	let scrollPositionAll = -1;

	onMount(() => {
		if (ref) {
			ref.addEventListener("scroll", () => {
				if (ref.scrollTop >= ref.scrollHeight - ref.clientHeight - 60) {
					hasUnread = false;
					if (backstageOnly) {
						scrollPositionBackstage = -1;
					} else {
						scrollPositionAll = -1;
					}
				} else {
					if (backstageOnly) {
						scrollPositionBackstage = ref.scrollTop;
					} else {
						scrollPositionAll = ref.scrollTop;
					}
				}
			});
		}
	});

	const allMessages = createDatabaseStore("message");
	const participants = createDatabaseStore("participant");

	$: backstageAllowed =
		$currentParticipant.actor || $currentParticipant.manager;
	$: allowedMessages = $allMessages
		.filter((m) => !m.backstage || backstageAllowed)
		.filter((m) => !backstageOnly || m.backstage);

	function participantName(id: number): string {
		const participant = $participants.find((p) => p.id == id);
		return participant?.name || "okänd";
	}
	function removeMessage(id: number) {
		remove("message", { where: { id } });
	}
	$: {
		if (backstageOnly && ref) {
			setTimeout(() => {
				ref.scroll({
					top:
						scrollPositionBackstage == -1
							? ref.scrollHeight
							: scrollPositionBackstage,
				});
			}, 0);
		} else if (!backstageOnly && ref) {
			setTimeout(() => {
				ref.scroll({
					top: scrollPositionAll == -1 ? ref.scrollHeight : scrollPositionAll,
				});
			}, 0);
		}
	}

	onMount(() => {
		const stop = allMessages.subscribe((data) => {
			if (loaded) {
				if (ref && ref.scrollTop > ref.scrollHeight - ref.clientHeight - 60) {
					setTimeout(() => {
						ref.scroll({ top: ref.scrollHeight });
					}, 0);
				} else {
					hasUnread = true;
				}
			} else if (!allMessages.isConnected()) {
				loaded = true;
				setTimeout(() => {
					if (ref) {
						ref.scroll({ top: ref.scrollHeight });
					}
				}, 0);
			}
		});

		return () => {
			stop();
		};
	});
</script>

<div class="list-container" bind:this={ref} class:has-unread={hasUnread}>
	<div class="list">
		{#if !allowedMessages.length}
			<div class="list-item">
				<div class="list-item-content">
					<div
						class="list-item-title is-family-title is-size-4 has-text-grey-light"
					>
						Här kommer chattmeddelanden att dyka upp..
					</div>
				</div>
			</div>
		{:else}
			{#each allowedMessages as message, index}
				{#key message.id}
					<div class="list-item">
						<div class="list-item-content" transition:blur>
							<div
								class:has-text-right={message.participantId ==
									$currentParticipant.id}
								class="list-item-description is-family-title is-size-6"
								class:has-text-link-light={message.backstage}
								class:has-text-grey-light={!message.backstage}
							>
								{message?.author || participantName(message.participantId)} ( {new Date(
									message.createdAt
								).getHours()}:{new Date(message.createdAt).getMinutes()}
								{message.backstage ? "backstage" : ""}
								)
							</div>
							<div
								class:is-underlined={message.participantId ==
									$currentParticipant.id}
								class="list-item-title"
								class:has-text-link={message.backstage}
							>
								{message.message}
							</div>
						</div>
						{#if $currentParticipant.manager}
							<div class="list-item-controls">
								<div class="buttons is-right">
									<button class="button is-small is-dark is-danger">
										<span
											class="icon"
											on:click={() => removeMessage(message.id)}
										>
											<PicoBadgeMinus />
										</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/key}
			{/each}
		{/if}
	</div>
</div>
{#if hasUnread}
	<div in:blur>
		<p
			class="has-text-centered has-text-weight-bold is-family-title h has-text-success"
		>
			nya meddelanden!
		</p>
	</div>
{/if}

<style>
	.list-container {
		max-height: 100%;
		overflow: scroll;
		display: block;
		flex-grow: 1;
		overflow: scroll;
		flex-basis: auto;
		align-self: auto;
		order: 0;
		padding: 8px;
		transition: border 0.4s;
	}
	.list-container.has-unread {
		border-bottom-width: 4px;
		border-bottom-color: var(--bulma-success);
		border-bottom-style: groove;
	}
	.list-item-description {
		font-weight: 900;
		letter-spacing: 0.1em;
	}
</style>
