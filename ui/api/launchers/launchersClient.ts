import { writable, derived, get } from "svelte/store";
import { launchersClient } from "~/api/_trpcClient";
import { getShowsList } from "../shows";
import type { LauncherSyncDataSerialized, LaunchAttributes } from "~/types/serverSideTypes";

/** Store for launcher system readiness */
export const launcherReadyStore = writable<boolean>(false);

/** Store for active adapter name */
export const activeAdapterStore = writable<string | null>(null);

/** Store for adapter status */
export const adapterStatusStore = writable<LauncherSyncDataSerialized["adapterStatus"] | null>(null);

/** Store for running launches */
export const instancesStore = writable<LaunchAttributes[]>([]);

/** Store for loading state */
export const launcherLoadingStore = writable<boolean>(false);

/** Store for error messages */
export const launcherErrorStore = writable<string | null>(null);

/** Derived store for whether launcher can launch instances */
export const canLaunchStore = derived([launcherReadyStore, adapterStatusStore], ([isReady, adapterStatus]) => {
	return isReady && adapterStatus?.canLaunch === true;
});

/** Derived store for running instances count */
export const runningInstancesCountStore = derived(instancesStore, (launches) => {
	return launches.filter((launch) => launch.status === "running" || launch.status === "starting").length;
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
 * Get list of available shows
 */
export async function getLaunchableShows(): Promise<{ id: number; name: string }[]> {
	try {
		const shows = await getShowsList();
		return shows.map((show) => ({ id: show.id, name: show.name }));
	} catch (error: any) {
		console.error("[Launchers] Failed to get shows list:", error);
		throw new Error(error?.message || "Failed to get shows list");
	}
}

/**
 * Launch a new stage instance for a show
 */
export async function launchShow(showId: number): Promise<{
	success: boolean;
	launchId?: number;
	instanceId?: string;
	url?: string;
	message?: string;
}> {
	try {
		launcherLoadingStore.set(true);
		launcherErrorStore.set(null);

		const result = await launchersClient.launch.mutate({
			showId,
		});

		// Refresh data after successful launch
		await syncLauncherData();

		return {
			success: true,
			launchId: result?.launchId,
			instanceId: result?.instanceId,
			url: result?.url,
			message: result?.message,
		};
	} catch (error: any) {
		console.error("[Launchers] Launch error:", error);
		const errorMessage = error?.message || "Failed to launch show";
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
 * Stop a running launch
 */
export async function stopInstance(instanceId: string): Promise<{
	success: boolean;
	message?: string;
}> {
	try {
		launcherLoadingStore.set(true);
		launcherErrorStore.set(null);

		// Find the launch with this instanceId
		const launches = get(instancesStore);
		const launch = launches.find((l) => l.instanceId === instanceId);

		if (!launch) {
			throw new Error("Launch not found for instance: " + instanceId);
		}

		const result = await launchersClient.stop.mutate({
			launchId: launch.id,
		});

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
 * Stop all running launches
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
 * Get status of a specific launch
 */
export async function getInstanceStatus(instanceId: string): Promise<string | null> {
	try {
		// Find the launch with this instanceId
		const launches = get(instancesStore);
		const launch = launches.find((l) => l.instanceId === instanceId);

		if (!launch) {
			return null;
		}

		const result = await launchersClient.getInstanceStatus.query({
			launchId: launch.id,
		});

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
