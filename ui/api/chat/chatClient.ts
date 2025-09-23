import { writable, derived } from "svelte/store";
import { chatClient } from "../_trpcClient";
import { peerStore } from "../room/roomClient";
import type { MessageAttributes } from "../../types/serverSideTypes";

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionMode = "all" | "public" | "backstage";

// ============================================================================
// CUSTOM MESSAGE STORE
// ============================================================================

//FIXME: Check how this actually works..
function createMessageStore(mode: SubscriptionMode = "public") {
	const { subscribe, set, update } = writable<MessageAttributes[]>([]);

	const currentMode: SubscriptionMode = mode;
	let subscription: any = null;
	let isSubscribed = false;

	/**
	 * Handle incoming message data from subscription
	 */
	function handleMessageData(data: any) {
		if (data === null) return;

		// Handle initial batch of messages
		if (Array.isArray(data)) {
			set(data as MessageAttributes[]);
			console.log(`[Chat] Received ${data.length} initial messages (${currentMode})`);
		}
		// Handle single new message
		else {
			update((messages: MessageAttributes[]) => [...messages, data as MessageAttributes]);
			console.log(`[Chat] New message received (${currentMode}):`, data);
		}
	}

	/**
	 * Subscribe to messages based on the store's mode
	 */
	async function subscribeToMessages() {
		// If already subscribed, do nothing
		if (isSubscribed && subscription) {
			return;
		}

		// Clear messages when switching modes
		set([]);

		try {
			switch (currentMode) {
				case "all":
					subscription = chatClient.messages.subscribe(undefined, {
						onData: handleMessageData,
						onError: (error: any) => {
							console.error("[Chat] Subscription error (all):", error);
							isSubscribed = false;
						},
						onComplete: () => {
							console.log("[Chat] Subscription completed (all)");
							isSubscribed = false;
						},
					});
					break;

				case "public":
					subscription = chatClient.publicMessages.subscribe(undefined, {
						onData: handleMessageData,
						onError: (error: any) => {
							console.error("[Chat] Subscription error (public):", error);
							isSubscribed = false;
						},
						onComplete: () => {
							console.log("[Chat] Subscription completed (public)");
							isSubscribed = false;
						},
					});
					break;

				case "backstage":
					subscription = chatClient.backstageMessages.subscribe(undefined, {
						onData: handleMessageData,
						onError: (error: any) => {
							console.error("[Chat] Subscription error (backstage):", error);
							isSubscribed = false;
						},
						onComplete: () => {
							console.log("[Chat] Subscription completed (backstage)");
							isSubscribed = false;
						},
					});
					break;
			}

			isSubscribed = true;
			console.log(`[Chat] Subscribed to ${currentMode} messages`);
		} catch (error) {
			console.error(`[Chat] Failed to subscribe to ${currentMode} messages:`, error);
		}
	}

	/**
	 * Unsubscribe from current subscription
	 */
	function unsubscribe() {
		if (subscription) {
			subscription.unsubscribe();
			subscription = null;
			isSubscribed = false;
			console.log(`[Chat] Unsubscribed from ${currentMode} messages`);
		}
		set([]);
	}

	/**
	 * Remove a message from the store (used when deleting)
	 */
	function removeMessage(messageId: number) {
		update((messages: MessageAttributes[]) => messages.filter((m: MessageAttributes) => m.id !== messageId));
	}

	return {
		subscribe,
		subscribeToMessages,
		unsubscribe,
		removeMessage,
	};
}

// ============================================================================
// SVELTE STORES
// ============================================================================

/**
 * Chat Messages - default to "all" mode
 */
export const messagesStore = createMessageStore("all");

/**
 * Messages filtered based on user permissions
 * Non-actors/managers only see public messages
 */
export const visibleMessagesStore = derived([messagesStore, peerStore], ([$messages, $peer]) => {
	// If user is actor or manager, show all messages
	if ($peer?.actor || $peer?.manager) {
		return $messages;
	}
	// Otherwise, only show public messages
	return $messages.filter((msg: MessageAttributes) => !msg.backstage);
});

/**
 * Indicates that the user can send backstage messages
 */
export const canSendBackstageStore = derived([peerStore], ([$peer]) => $peer?.actor || $peer?.manager);

/**
 * Indicates that the user can delete messages
 */
export const canDeleteMessagesStore = derived([peerStore], ([$peer]) => $peer?.manager === true);

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Start subscribing to messages (uses the store's fixed mode)
 */
export async function startChatSubscription() {
	await messagesStore.subscribeToMessages();
}

/**
 * Send a regular message
 */
export async function sendPublicMessage(message: string, sender?: string) {
	await chatClient.send.mutate({
		message,
		peerName: sender,
		backstage: false,
	});
}

/**
 * Send a backstage message
 */
export async function sendBackstageMessage(message: string, sender?: string) {
	await chatClient.send.mutate({
		message,
		peerName: sender,
		backstage: true,
	});
}

/**
 * Delete a message (managers only)
 */
export async function deleteMessage(messageId: number) {
	await chatClient.delete.mutate({
		messageId,
	});
}
