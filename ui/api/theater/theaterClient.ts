import { writable, type Readable } from "svelte/store";
import { theaterClient } from "../_trpcClient";
import type { IpcStatus } from "~/types/serverSideTypes";

/**
 * Type for the remote server status store value
 */
type RemoteServerStatusValue = Omit<IpcStatus, "createdAt" | "endedAt"> & {
	createdAt: string;
	endedAt?: string | undefined;
};

/**
 * Type for the auto-updating remote server status store
 */
type RemoteServerStatusStore = Readable<RemoteServerStatusValue | null> & {
	set: (value: RemoteServerStatusValue | null) => void;
};

/**
 * Loading state for remote server operations
 */
export const remoteServerStatusIsLoading = writable(false);

/**
 * Error state for remote server operations
 */
export const remoteServerStatusError = writable<string | null>(null);

/**
 * Stage server status store that auto-updates when subscribed
 */
export const remoteServerStatusStore: RemoteServerStatusStore = (() => {
	const { subscribe, set } = writable<RemoteServerStatusValue | null>(null);
	let pollInterval: number | null = null;

	// Initial update
	updateRemoteServerStatus();

	return {
		subscribe: (run: (value: RemoteServerStatusValue | null) => void, invalidate?: (value?: RemoteServerStatusValue | null) => void) => {
			pollInterval =
				pollInterval ||
				window.setInterval(() => {
					updateRemoteServerStatus();
				}, 2000);

			const unsubscribe = subscribe(run, invalidate);

			return () => {
				if (pollInterval) {
					clearInterval(pollInterval);
					pollInterval = null;
				}
				unsubscribe();
			};
		},
		set,
	};
})();

/**
 * Updates the current status of the stage server
 */
export async function updateRemoteServerStatus() {
	try {
		remoteServerStatusError.set(null);
		const status = (await theaterClient.status.query()) as RemoteServerStatusValue;
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
