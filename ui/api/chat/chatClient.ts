import { derived, readable } from "svelte/store";
import type { MessageAttributes } from "../../types/serverSideTypes";
import { chatClient } from "../_trpcClient";
import { currentPeerStore } from "../auth";
import { getCurrentShowId } from "../backstage";

// Type for message data as received over the wire (with serialized dates)
type SerializedMessage = Omit<MessageAttributes, "createdAt"> & { createdAt: string };

/**
 * Chat messages store with automatic subscription management to the server
 */
export const messagesStore = readable<MessageAttributes[]>([], (set, update) => {
	try {
		const showId = getCurrentShowId();
		console.log(`[Chat] Starting backend subscription with showId: ${showId}`);

		if (CONFIG.runtime.theater && showId === null) {
			throw new Error("ShowId is required in theater mode");
		}

		// Start new subscription
		const serverSubscription = chatClient.messages.subscribe(
			{ showId },
			{
				onData: (data) => {
					if (CONFIG.runtime.debug) {
						console.log("[Chat] Subscription data:", data);
					}

					// Handle initial batch of messages
					if (data.event === "initial" && Array.isArray(data.initialMessages)) {
						// Convert serialized messages to proper format
						const messages = (data.initialMessages as SerializedMessage[]).map((msg) => ({
							...msg,
							createdAt: new Date(msg.createdAt),
						})) as MessageAttributes[];
						set(messages);
						console.log(`[Chat] Received ${data.initialMessages.length} initial messages`);
					}
					// Handle deleted message
					else if (data.event === "deleted") {
						update((messages) => messages.filter((message) => message.id !== data.messageId));
					}
					// Handle single new message
					else if (data.event === "created") {
						// Convert single serialized message to proper format
						const message = {
							...(data.message as SerializedMessage),
							createdAt: new Date((data.message as SerializedMessage).createdAt),
						} as MessageAttributes;
						update((messages) => [...messages, message]);
					} else {
						console.warn("[Chat] Received invalid data in subscription");
						return;
					}
				},
				onError: (error) => {
					console.error("[Chat] Subscription error:", error);
				},
				onComplete: () => {
					console.log("[Chat] Subscription completed");
				},
			},
		);

		return serverSubscription.unsubscribe;
	} catch (error) {
		console.error("[Chat] Failed to start backend subscription:", error);
		throw error;
	}
});

/**
 * Indicates that the user can send backstage messages
 */
export const canSendBackstageStore = derived([currentPeerStore], ([$peer]) => $peer?.actor || $peer?.manager);

/**
 * Indicates that the user can delete messages
 */
export const canDeleteMessagesStore = derived([currentPeerStore], ([$peer]) => $peer?.manager === true);

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
	} catch (error) {
		console.error("[Chat] Failed to delete message:", error);
		throw error;
	}
}
