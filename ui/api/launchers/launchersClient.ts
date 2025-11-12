import { writable, derived } from "svelte/store";
import { launchersClient } from "../_trpcClient";
import type { LauncherSyncDataSerialized } from "~/types/serverSideTypes";

/** Store for launcher system readiness */
export const launcherReadyStore = writable<boolean>(false);

/** Store for active adapter name */
export const activeAdapterStore = writable<string | null>(null);

/** Store for adapter status */
export const adapterStatusStore = writable<LauncherSyncDataSerialized["adapterStatus"] | null>(null);

/** Store for running instances */
export const instancesStore = writable<LauncherSyncDataSerialized["instances"]>([]);

/** Store for loading state */
export const launcherLoadingStore = writable<boolean>(false);

/** Store for error messages */
export const launcherErrorStore = writable<string | null>(null);

/** Derived store for whether launcher can launch instances */
export const canLaunchStore = derived([launcherReadyStore, adapterStatusStore], ([isReady, adapterStatus]) => {
	return isReady && adapterStatus?.canLaunch === true;
});

/** Derived store for running instances count */
export const runningInstancesCountStore = derived(instancesStore, (instances) => {
	return instances.filter((instance) => instance.status === "running" || instance.status === "starting").length;
});

/**
 * Fetch and update launcher sync data
 */
export async function syncLauncherData(): Promise<void> {
	try {
		launcherErrorStore.set(null);
		const syncData = await launchersClient.sync.query();

		// Update all stores
		launcherReadyStore.set(syncData.isReady);
		activeAdapterStore.set(syncData.activeAdapter);
		adapterStatusStore.set(syncData.adapterStatus);
		instancesStore.set(syncData.instances);
	} catch (error: any) {
		console.error("[Launchers] Sync error:", error);
		launcherErrorStore.set(error?.message || "Failed to sync launcher data");
	}
}

/**
 * Launch a new stage instance for a show
 */
export async function launchInstance(
	showId: number,
	adapterName?: string,
): Promise<{
	success: boolean;
	instanceId?: string;
	url?: string;
	message?: string;
}> {
	try {
		launcherLoadingStore.set(true);
		launcherErrorStore.set(null);

		const result = await launchersClient.launch.mutate({
			showId,
			adapterName,
		});

		// Refresh data after successful launch
		await syncLauncherData();

		return {
			success: true,
			instanceId: result?.instanceId,
			url: result?.url,
			message: result?.message,
		};
	} catch (error: any) {
		console.error("[Launchers] Launch error:", error);
		const errorMessage = error?.message || "Failed to launch instance";
		launcherErrorStore.set(errorMessage);

		return {
			success: false,
			message: errorMessage,
		};
	} finally {
		launcherLoadingStore.set(false);
	}
}

/**
 * Stop a running instance
 */
export async function stopInstance(instanceId: string): Promise<{
	success: boolean;
	message?: string;
}> {
	try {
		launcherLoadingStore.set(true);
		launcherErrorStore.set(null);

		const result = await launchersClient.stop.mutate({ instanceId });

		// Refresh data after successful stop
		await syncLauncherData();

		return {
			success: true,
			message: result?.message,
		};
	} catch (error: any) {
		console.error("[Launchers] Stop error:", error);
		const errorMessage = error?.message || "Failed to stop instance";
		launcherErrorStore.set(errorMessage);

		return {
			success: false,
			message: errorMessage,
		};
	} finally {
		launcherLoadingStore.set(false);
	}
}

/**
 * Stop all running instances
 */
export async function stopAllInstances(): Promise<{
	success: boolean;
	stoppedCount?: number;
	message?: string;
}> {
	try {
		launcherLoadingStore.set(true);
		launcherErrorStore.set(null);

		const result = await launchersClient.stopAll.mutate();

		// Refresh data after successful stop
		await syncLauncherData();

		return {
			success: true,
			stoppedCount: result?.stoppedCount,
			message: result?.message,
		};
	} catch (error: any) {
		console.error("[Launchers] Stop all error:", error);
		const errorMessage = error?.message || "Failed to stop instances";
		launcherErrorStore.set(errorMessage);

		return {
			success: false,
			message: errorMessage,
		};
	} finally {
		launcherLoadingStore.set(false);
	}
}

/**
 * Get status of a specific instance
 */
export async function getInstanceStatus(instanceId: string): Promise<string | null> {
	try {
		const result = await launchersClient.getInstanceStatus.query({ instanceId });
		return result?.status || null;
	} catch (error: any) {
		console.error("[Launchers] Get status error:", error);
		return null;
	}
}

/**
 * Check if launcher can launch instances
 */
export async function checkCanLaunch(): Promise<{
	canLaunch: boolean;
	reason?: string;
	adapterName?: string;
}> {
	try {
		const result = await launchersClient.canLaunch.query();
		return {
			canLaunch: result?.canLaunch || false,
			reason: result?.reason,
			adapterName: result?.adapterName || undefined,
		};
	} catch (error: any) {
		console.error("[Launchers] Check launch capability error:", error);
		return {
			canLaunch: false,
			reason: error?.message || "Failed to check launch capability",
		};
	}
}

/**
 * Auto-sync launcher data periodically
 */
export function startLauncherSync(intervalMs: number = 5000): () => void {
	// Initial sync
	syncLauncherData();

	// Set up periodic sync
	const intervalId = setInterval(syncLauncherData, intervalMs);

	// Return cleanup function
	return () => {
		clearInterval(intervalId);
	};
}
