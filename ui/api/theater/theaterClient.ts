import { writable } from "svelte/store";
import { theaterClient } from "../_trpcClient";
import type { IpcStatus } from "~/types/serverSideTypes";

/**
 * Loading state for remote server operations
 */
export const remoteServerStatusIsLoading = writable(false);

/**
 * Error state for remote server operations
 */
export const remoteServerStatusError = writable<string | null>(null);

/**
 * Stage server status store
 */
export const remoteServerStatusStore = writable<(Omit<IpcStatus, "createdAt" | "endedAt"> & { createdAt: string; endedAt?: string | undefined }) | null>(null);

/**
 * Updates the current status of the stage server
 */
export async function updateRemoteServerStatus() {
	try {
		remoteServerStatusError.set(null);
		const status = await theaterClient.status.query();
		remoteServerStatusStore.set(status);
	} catch (error) {
		remoteServerStatusIsLoading.set(false);
		remoteServerStatusError.set(error instanceof Error ? error.message : "Unknown error");
	}
}

/**
 * End the current show on the stage server and update stores
 */
export async function endCurrentShowOnRemoteServer() {
	try {
		remoteServerStatusError.set(null);
		remoteServerStatusIsLoading.set(true);
		remoteServerStatusError.set(null);
		await theaterClient.end.mutate();
		setTimeout(() => {
			remoteServerStatusIsLoading.set(false);
			updateRemoteServerStatus();
		}, 6000);
	} catch (error) {
		remoteServerStatusIsLoading.set(false);
		remoteServerStatusError.set(error instanceof Error ? error.message : "Unknown error");
	}
}

/**
 * Start or restart a show on the stage server and update stores
 */
export async function startShowOnRemoteServer(showId: number) {
	try {
		remoteServerStatusError.set(null);
		remoteServerStatusIsLoading.set(true);
		remoteServerStatusError.set(null);
		await theaterClient.start.mutate({ showId });
		setTimeout(() => {
			remoteServerStatusIsLoading.set(false);
			updateRemoteServerStatus();
		}, 8000);
	} catch (error) {
		remoteServerStatusIsLoading.set(false);
		remoteServerStatusError.set(error instanceof Error ? error.message : "Unknown error");
	}
}
