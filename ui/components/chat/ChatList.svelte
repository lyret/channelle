<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { blur } from "svelte/transition";
	import { messagesStore, canDeleteMessagesStore, deleteMessage } from "~/api/chat";
	import { currentPeerStore } from "~/api";

	export let backstageOnly: boolean = false;

	let ref: HTMLDivElement;
	let hasUnread = false;
	let scrollPositionBackstage = -1;
	let scrollPositionAll = -1;
	let previousMessageCount = 0;

	// Initialize chat when component mounts
	onMount(() => {
		// Set up scroll handling
		if (ref) {
			ref.addEventListener("scroll", handleScroll);
			// Scroll to bottom initially
			setTimeout(() => {
				scrollToBottom();
			}, 100);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (ref) {
			ref.removeEventListener("scroll", handleScroll);
		}
	});

	function handleScroll() {
		if (!ref) return;

		// Check if we're near the bottom
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
	}

	function scrollToBottom() {
		if (!ref) return;
		ref.scrollTop = ref.scrollHeight;
	}

	// Format time for display
	function formatTime(date: Date | string): string {
		try {
			const d = typeof date === "string" ? new Date(date) : date;
			const hours = d.getHours().toString().padStart(2, "0");
			const minutes = d.getMinutes().toString().padStart(2, "0");
			return `${hours}:${minutes}`;
		} catch (error) {
			console.error("[Chat] Error formatting time:", error);
			return "";
		}
	}

	// Filter messages based on backstageOnly prop
	$: filteredMessages = backstageOnly ? $messagesStore.filter((msg) => msg.backstage) : $messagesStore;

	// Auto-scroll when new messages arrive
	$: handleNewMessages(filteredMessages);

	function handleNewMessages(messages: any[]) {
		if (!messages || !ref) return;

		// Only react to new messages, not initial load or ref changes
		if (messages.length > previousMessageCount) {
			previousMessageCount = messages.length;

			// Check if we should auto-scroll
			const shouldAutoScroll = ref.scrollTop >= ref.scrollHeight - ref.clientHeight - 100;

			if (shouldAutoScroll) {
				setTimeout(() => {
					scrollToBottom();
				}, 0);
			} else {
				// Show unread indicator
				hasUnread = true;
			}
		}
	}

	// Handle view switching between backstage and all messages
	$: handleViewSwitch(backstageOnly);

	function handleViewSwitch(isBackstage: boolean) {
		if (isBackstage !== undefined && ref) {
			setTimeout(() => {
				if (!ref) return;

				if (isBackstage) {
					ref.scroll({
						top: scrollPositionBackstage === -1 ? ref.scrollHeight : scrollPositionBackstage,
					});
				} else {
					ref.scroll({
						top: scrollPositionAll === -1 ? ref.scrollHeight : scrollPositionAll,
					});
				}
			}, 0);
		}
	}
</script>

<div class="list-container" bind:this={ref} class:has-unread={hasUnread}>
	<div class="list">
		{#if !filteredMessages || filteredMessages.length === 0}
			<div class="is-size-4 has-text-grey-light">
				{#if backstageOnly}
					Inga backstage-meddelanden ännu...
				{:else}
					Här kommer chattmeddelanden att dyka upp...
				{/if}
			</div>
		{:else}
			{#each filteredMessages as message (message.id)}
				<div class="list-item" transition:blur|local>
					<div class="list-item-content">
						<div
							class:has-text-right={message.peerId === $currentPeerStore?.id}
							class="list-item-description is-size-6"
							class:has-text-warning-light={message.backstage}
							class:has-text-grey-light={!message.backstage}
						>
							{message.peerName || "Anonym"}
							{formatTime(message.createdAt)}
							{#if message.backstage}
								<span class="tag is-small is-warning ml-1">backstage</span>
							{/if}
						</div>
						<div
							class="list-item-title"
							class:pl-4={message.peerId === $currentPeerStore?.id}
							class:has-text-warning={message.backstage}
							class:has-text-white={!message.backstage}
						>
							{message.message}
						</div>
					</div>
					{#if $canDeleteMessagesStore}
						<div class="list-item-controls">
							<div class="buttons is-right">
								<button
									class="button icon is-rounded is-small is-dark is-danger"
									on:click={() => deleteMessage(message.id)}
									title="Ta bort meddelande"
								>
									X
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

{#if hasUnread}
	<div class="unread-indicator" in:blur|local>
		<p class="has-text-centered has-text-weight-bold is-family-title has-text-success">Nya meddelanden!</p>
	</div>
{/if}

<style>
	.list-container {
		max-height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		display: block;
		flex-grow: 1;
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

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.list-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		transition: background 0.2s;
	}

	.list-item:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.list-item-content {
		flex: 1;
		min-width: 0;
	}

	.list-item-description {
		font-weight: 900;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.list-item-title {
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
	}

	.list-item-controls {
		margin-left: 0.5rem;
		flex-shrink: 0;
	}

	.unread-indicator {
		position: sticky;
		bottom: 0;
		background: rgba(0, 0, 0, 0.9);
		padding: 0.5rem;
		border-top: 2px solid var(--bulma-success);
	}

	.tag {
		vertical-align: baseline;
	}
</style>
