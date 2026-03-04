import { writable } from "svelte/store";
import { historyClient } from "~/api/_trpcClient";
import type { HistoryAttributes } from "~/types/databaseTypes";

/**
 * History store
 */
export const historyStore = writable<HistoryAttributes[]>([]);

/**
 * Loading state for history operations
 */
export const historyStoreIsLoading = writable(false);

/**
 * Error state for history operations
 */
export const historyErrorStore = writable<string | null>(null);

/**
 * Set loading state
 */
export function setHistoryLoading(loading: boolean) {
	historyStoreIsLoading.set(loading);
}

/**
 * Set error state
 */
export function setHistoryError(error: string | null) {
	historyErrorStore.set(error);
}

/**
 * Fetch all history records and update store
 */
export async function fetchHistory() {
	setHistoryLoading(true);
	setHistoryError(null);

	try {
		const result = await historyClient.getAll.query();
		historyStore.set(result);
		return result;
	} catch (error) {
		console.error("Error fetching history:", error);
		setHistoryError(error instanceof Error ? error.message : "Failed to fetch history");
		throw error;
	} finally {
		setHistoryLoading(false);
	}
}

/**
 * Fetch history records for a specific show
 */
export async function fetchHistoryByShow(showId: number) {
	setHistoryLoading(true);
	setHistoryError(null);

	try {
		const result = await historyClient.getByShow.query({ showId });
		return result;
	} catch (error) {
		console.error(`Error fetching history for show ${showId}:`, error);
		setHistoryError(error instanceof Error ? error.message : "Failed to fetch history");
		throw error;
	} finally {
		setHistoryLoading(false);
	}
}
