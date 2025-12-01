import { writable, derived, get } from "svelte/store";
import { chatClient } from "../_trpcClient";
import { currentPeerStore } from "../auth";
import { getCurrentShowId, configurationIsLoading } from "../backstage";
import type { MessageAttributes } from "../../types/serverSideTypes";

// Type for message data as received over the wire (with serialized dates)
type SerializedMessage = Omit<MessageAttributes, "createdAt"> & { createdAt: string };

// ============================================================================
// INTERNAL STORES
// ============================================================================

/** Internal store containing all chat messages */
const _chatMessages = writable<MessageAttributes[]>([]);

/** Loading state for chat operations */
export const chatIsLoading = writable<boolean>(false);

/** Error messages from chat operations */
export const chatError = writable<string | null>(null);

// ============================================================================
// PUBLIC DERIVED STORES
// ============================================================================

/**
 * All chat messages
 */
export const messagesStore = derived(_chatMessages, ($messages) => $messages);

/**
 * Messages filtered based on user permissions
 * Non-actors/managers only see public messages
 */
export const visibleMessagesStore = derived([_chatMessages, currentPeerStore], ([$messages, $peer]) => {
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
export const canSendBackstageStore = derived([currentPeerStore], ([$peer]) => $peer?.actor || $peer?.manager);

/**
 * Indicates that the user can delete messages
 */
export const canDeleteMessagesStore = derived([currentPeerStore], ([$peer]) => $peer?.manager === true);

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

let _subscription: any = null;

/**
 * Subscribe to all chat messages with automatic showId handling
 */
export async function subscribeToMessages(): Promise<void> {
	try {
		chatIsLoading.set(true);
		chatError.set(null);

		// Wait for configuration to be loaded in theater mode
		if (CONFIG.runtime.theater) {
			const isLoading = get(configurationIsLoading);
			if (isLoading) {
				console.log("[Chat] Waiting for backstage configuration to load...");
				// Wait a bit and retry
				setTimeout(() => subscribeToMessages(), 100);
				return;
			}
		}

		const showId = getCurrentShowId();
		console.log(`[Chat] Starting messages subscription with showId: ${showId}`);

		if (CONFIG.runtime.theater && showId === null) {
			throw new Error("ShowId is required in theater mode");
		}

		// Unsubscribe from any existing subscription
		if (_subscription) {
			_subscription.unsubscribe();
			_subscription = null;
		}

		// Start new subscription
		_subscription = chatClient.messages.subscribe(
			{ showId },
			{
				onData: (trackedData) => {
					if (CONFIG.runtime.debug) {
						console.log("[Chat] Subscription data:", trackedData);
					}

					if (!trackedData || !trackedData.data) {
						console.warn("[Chat] Received invalid data in subscription");
						return;
					}

					const data = trackedData.data;

					// Handle initial batch of messages
					if (trackedData.id === "initial" && Array.isArray(data)) {
						// Convert serialized messages to proper format
						const messages = (data as SerializedMessage[]).map((msg) => ({
							...msg,
							createdAt: new Date(msg.createdAt),
						})) as MessageAttributes[];
						_chatMessages.set(messages);
						console.log(`[Chat] Received ${data.length} initial messages`);
						chatIsLoading.set(false);
					}
					// Handle single new message
					else if (typeof data === "object" && !Array.isArray(data)) {
						// Convert single serialized message to proper format
						const message = {
							...(data as SerializedMessage),
							createdAt: new Date((data as SerializedMessage).createdAt),
						} as MessageAttributes;
						_chatMessages.update((messages) => [...messages, message]);
						console.log("[Chat] New message received:", data);
					}
				},
				onError: (error) => {
					console.error("[Chat] Subscription error:", error);
					chatError.set(error instanceof Error ? error.message : "Unknown subscription error");
					chatIsLoading.set(false);
				},
				onComplete: () => {
					console.log("[Chat] Subscription completed");
					chatIsLoading.set(false);
				},
			},
		);
	} catch (error) {
		console.error("[Chat] Failed to subscribe to messages:", error);
		chatError.set(error instanceof Error ? error.message : "Failed to subscribe to messages");
		chatIsLoading.set(false);
	}
}

/**
 * Unsubscribe from chat messages
 */
export function unsubscribeFromMessages(): void {
	if (_subscription) {
		_subscription.unsubscribe();
		_subscription = null;
		console.log("[Chat] Unsubscribed from messages");
	}
	_chatMessages.set([]);
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Start subscribing to messages (alias for backward compatibility)
 */
export async function startChatSubscription(): Promise<void> {
	return subscribeToMessages();
}

/**
 * Send a regular message
 */
export async function sendPublicMessage(message: string, sender?: string): Promise<void> {
	const showId = getCurrentShowId();

	if (CONFIG.runtime.debug) {
		console.log(`[Chat] Sending public message with showId: ${showId}`);
	}

	await chatClient.send.mutate({
		showId,
		message,
		peerName: sender,
		backstage: false,
	});
}

/**
 * Send a backstage message
 */
export async function sendBackstageMessage(message: string, sender?: string): Promise<void> {
	const showId = getCurrentShowId();

	if (CONFIG.runtime.debug) {
		console.log(`[Chat] Sending backstage message with showId: ${showId}`);
	}

	await chatClient.send.mutate({
		showId,
		message,
		peerName: sender,
		backstage: true,
	});
}

/**
 * Delete a message (managers only)
 */
export async function deleteMessage(messageId: number): Promise<void> {
	const showId = getCurrentShowId();

	try {
		await chatClient.delete.mutate({
			showId,
			messageId,
		});

		// Remove message from local store immediately for better UX
		_chatMessages.update((messages) => messages.filter((m) => m.id !== messageId));
	} catch (error) {
		console.error("[Chat] Failed to delete message:", error);
		throw error;
	}
}
