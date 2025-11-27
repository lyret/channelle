/**
 * Media room participation and synchronization
 * Handles joining the media room and maintaining sync with server
 */
import { get } from "svelte/store";
import * as MediaSoup from "mediasoup-client";
import { deviceStore, mediaRoomIsLoading, mediaRoomError, sessionsStore, sendTransportStore, consumersStore } from "./stores";
import { stageClient, wsPeerIdStore } from "../_trpcClient";
import { currentPeerStore } from "../auth";
import { subscribeToTrack, unsubscribeFromTrack, closeConsumer } from "./consumer";
import { createTransport } from "./transport";
import { _sendMediaStreams } from "./localMedia";
import { findConsumerForTrack } from "./utils";
import type { MediaTag } from "./types";

// Store previous synced sessions for comparison
let _previousSyncedSessions: Record<string, any> = {};

/**
 * Join the media room and start syncing with the server
 * @returns Success or error result
 */
export async function participateInTheMediaRoom(): Promise<{ success: true } | { success: false; error: string }> {
	console.log("[Stage] Participating in media room");

	try {
		// Get router RTP capabilities from server
		const routerRtpCapabilities = await stageClient.getRouterRtpCapabilities.query();
		console.log("[Stage] Got router RTP capabilities");

		// Create and initialize MediaSoup device
		let device = get(deviceStore);
		if (!device) {
			device = new MediaSoup.Device();
			await device.load({ routerRtpCapabilities });
			deviceStore.set(device);
			console.log("[Stage] MediaSoup device initialized");
		}

		// Start syncing with the media room
		console.log("[Stage] Starting media room sync");
		mediaRoomIsLoading.set(true);
		mediaRoomError.set(null);

		const { unsubscribe } = stageClient.syncMediaRoom.subscribe(undefined, {
			onData: async (data) => {
				if (!data) {
					console.warn("[Stage] Received null sync data");
					return;
				}

				mediaRoomIsLoading.set(false);
				mediaRoomError.set(null);

				// Process sync data
				await processSyncData(data);
			},
			onError: (error) => {
				console.error("[Stage] Media room sync error:", error);
				mediaRoomIsLoading.set(false);
				mediaRoomError.set(error.message);
			},
			onComplete: () => {
				console.log("[Stage] Media room sync completed");
				mediaRoomIsLoading.set(false);
			},
		});

		// Store unsubscribe function for cleanup
		(window as any).__mediaRoomUnsubscribe = unsubscribe;

		return { success: true };
	} catch (error) {
		console.error("[Stage] Failed to participate in media room:", error);
		mediaRoomIsLoading.set(false);
		mediaRoomError.set((error as Error).message);
		return { success: false, error: (error as Error).message };
	}
}

/**
 * Process sync data from the media room
 * @param data - Sync data from server
 */
async function processSyncData(data: any): Promise<void> {
	const myPeerId = get(wsPeerIdStore);

	// Update sessions store
	if (data.sessions) {
		sessionsStore.set(data.sessions);
		await handleSessionChanges(data.sessions, myPeerId);
	}

	// Handle transport requests
	if (data.needsSendTransport && !get(sendTransportStore)) {
		console.log("[Stage] Server requested send transport creation");
		await createTransport("send");
	}

	// Handle producer requests
	if (data.needsProducers && get(sendTransportStore)) {
		console.log("[Stage] Server requested producers");
		await _sendMediaStreams();
	}

	// Handle consumer updates
	if (data.consumers) {
		await handleConsumerUpdates(data.consumers);
	}
}

/**
 * Handle changes in peer sessions
 * @param sessions - Current sessions from server
 * @param myPeerId - Current user's peer ID
 */
async function handleSessionChanges(sessions: Record<string, any>, myPeerId: string): Promise<void> {
	const previousSessions = _previousSyncedSessions;

	// Check for new or updated sessions
	for (const [peerId, session] of Object.entries(sessions)) {
		// Skip our own session
		if (peerId === myPeerId) continue;

		const previousSession = previousSessions[peerId];

		// New peer joined
		if (!previousSession) {
			console.log(`[Stage] New peer joined: ${peerId}`);
			await handleNewPeer(peerId, session);
		}
		// Existing peer updated
		else if (hasSessionChanged(previousSession, session)) {
			console.log(`[Stage] Peer session updated: ${peerId}`);
			await handleUpdatedPeer(peerId, session, previousSession);
		}
	}

	// Check for disconnected peers
	for (const peerId of Object.keys(previousSessions)) {
		if (!sessions[peerId] && peerId !== myPeerId) {
			console.log(`[Stage] Peer disconnected: ${peerId}`);
			await handleDisconnectedPeer(peerId);
		}
	}

	// Update previous sessions
	_previousSyncedSessions = { ...sessions };
}

/**
 * Handle a new peer joining
 * @param peerId - ID of the new peer
 * @param session - Session data for the new peer
 */
async function handleNewPeer(peerId: string, session: any): Promise<void> {
	// Subscribe to their media if available
	if (session.hasMedia) {
		if (session.videoAvailable) {
			await subscribeToTrack(peerId, "video");
		}
		if (session.audioAvailable) {
			await subscribeToTrack(peerId, "audio");
		}
	}
}

/**
 * Handle an existing peer's session update
 * @param peerId - ID of the peer
 * @param session - New session data
 * @param previousSession - Previous session data
 */
async function handleUpdatedPeer(peerId: string, session: any, previousSession: any): Promise<void> {
	// Check video availability changes
	if (session.videoAvailable !== previousSession.videoAvailable) {
		if (session.videoAvailable) {
			await subscribeToTrack(peerId, "video");
		} else {
			await unsubscribeFromTrack(peerId, "video");
		}
	}

	// Check audio availability changes
	if (session.audioAvailable !== previousSession.audioAvailable) {
		if (session.audioAvailable) {
			await subscribeToTrack(peerId, "audio");
		} else {
			await unsubscribeFromTrack(peerId, "audio");
		}
	}
}

/**
 * Handle a peer disconnecting
 * @param peerId - ID of the disconnected peer
 */
async function handleDisconnectedPeer(peerId: string): Promise<void> {
	// Unsubscribe from all their tracks
	await unsubscribeFromTrack(peerId, "video");
	await unsubscribeFromTrack(peerId, "audio");

	// Close any remaining consumers for this peer
	const consumers = get(consumersStore);
	const peerConsumers = consumers.filter((c) => c.appData.peerId === peerId);

	for (const consumer of peerConsumers) {
		await closeConsumer(consumer);
	}
}

/**
 * Handle consumer updates from sync
 * @param serverConsumers - Consumer data from server
 */
async function handleConsumerUpdates(serverConsumers: any[]): Promise<void> {
	const localConsumers = get(consumersStore);

	// Find and close consumers that no longer exist on server
	for (const consumer of localConsumers) {
		const existsOnServer = serverConsumers.some((sc) => sc.id === consumer.id);
		if (!existsOnServer) {
			console.log(`[Stage] Closing consumer ${consumer.id} (no longer on server)`);
			await closeConsumer(consumer);
		}
	}

	// Update consumer states based on server data
	for (const serverConsumer of serverConsumers) {
		const localConsumer = localConsumers.find((c) => c.id === serverConsumer.id);
		if (localConsumer) {
			// Update paused state if different
			if (serverConsumer.paused !== localConsumer.paused) {
				if (serverConsumer.paused) {
					await localConsumer.pause();
				} else {
					await localConsumer.resume();
				}
			}
		}
	}
}

/**
 * Check if a session has changed in a meaningful way
 * @param previousSession - Previous session data
 * @param currentSession - Current session data
 * @returns True if session has changed
 */
function hasSessionChanged(previousSession: any, currentSession: any): boolean {
	return (
		previousSession.hasMedia !== currentSession.hasMedia ||
		previousSession.videoAvailable !== currentSession.videoAvailable ||
		previousSession.audioAvailable !== currentSession.audioAvailable
	);
}

/**
 * Leave the media room and stop syncing
 */
export async function leaveMediaRoom(): Promise<void> {
	console.log("[Stage] Leaving media room");

	// Stop sync subscription
	const unsubscribe = (window as any).__mediaRoomUnsubscribe;
	if (unsubscribe) {
		unsubscribe();
		delete (window as any).__mediaRoomUnsubscribe;
	}

	// Reset stores
	mediaRoomIsLoading.set(false);
	mediaRoomError.set(null);
	sessionsStore.set({});
	_previousSyncedSessions = {};
}

/**
 * Get current media room status
 * @returns Object with loading state and error
 */
export function getMediaRoomStatus(): { isLoading: boolean; error: string | null } {
	return {
		isLoading: get(mediaRoomIsLoading),
		error: get(mediaRoomError),
	};
}

/**
 * Check if currently participating in media room
 * @returns True if participating
 */
export function isParticipating(): boolean {
	return !!(window as any).__mediaRoomUnsubscribe;
}
