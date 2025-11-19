import type { RouterOutputTypes, RouterInputTypes } from "../_trpcClient";
import { writable, derived } from "svelte/store";
import { showsClient } from "../_trpcClient";

// ============================================================================
// STORES
// ============================================================================

/** Whenever the show data is loading */
export const showsStoreIsLoading = writable<boolean>(false);

/** All available shows in the system */
export const showsListStore = writable<RouterOutputTypes["shows"]["list"]>([]);

/** Contains any errors from show client operations */
export const showsErrorStore = writable<string | null>(null);

// DERIVED STORES (Convenient views of show data)

/** Shows that are currently running/online - filtered from showsStore */
export const onlineShowsStore = derived(showsListStore, ($shows) => $shows.filter((show) => show.online));

// ============================================================================
// SHOW CRUD FUNCTIONS
// ============================================================================

/**
 * Fetch all shows from the server and update stores
 *
 * This function retrieves the complete list of shows available in the system,
 * updates the shows list store, and handles loading states and errors.
 */
export async function fetchShows(): Promise<void> {
	try {
		showsStoreIsLoading.set(true);
		showsErrorStore.set(null);

		const shows = await showsClient.list.query();
		showsListStore.set(shows);
	} catch (error) {
		console.error("Failed to fetch shows:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to fetch shows");
	} finally {
		showsStoreIsLoading.set(false);
	}
}

/** Get a specific show by ID */
export async function getShow(id: number): Promise<RouterOutputTypes["shows"]["get"] | null> {
	try {
		showsErrorStore.set(null);
		const show = await showsClient.get.query({ id });
		return show;
	} catch (error) {
		console.error("Failed to get show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to get show");
		return null;
	}
}

/** Create a new show in the system */
export async function createShow(data: RouterInputTypes["shows"]["create"]): Promise<RouterOutputTypes["shows"]["create"] | null> {
	try {
		showsStoreIsLoading.set(true);
		showsErrorStore.set(null);

		const show = await showsClient.create.mutate(data);

		// Refresh the shows list
		await fetchShows();

		return show;
	} catch (error) {
		console.error("Failed to create show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to create show");
		return null;
	} finally {
		showsStoreIsLoading.set(false);
	}
}

/** Update an existing show's basic information */
export async function updateShow(data: RouterOutputTypes["shows"]["update"]): Promise<RouterOutputTypes["shows"]["update"] | null> {
	try {
		showsStoreIsLoading.set(true);
		showsErrorStore.set(null);

		const show = await showsClient.update.mutate(data);

		// Refresh the shows list
		await fetchShows();

		return show;
	} catch (error) {
		console.error("Failed to update show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to update show");
		return null;
	} finally {
		showsStoreIsLoading.set(false);
	}
}

/** Delete a show from the system */
export async function deleteShow(id: number): Promise<boolean> {
	try {
		showsStoreIsLoading.set(true);
		showsErrorStore.set(null);

		const result = await showsClient.delete.mutate({ id });

		// Refresh the shows list
		await fetchShows();

		return result.success;
	} catch (error) {
		console.error("Failed to delete show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to delete show");
		return false;
	} finally {
		showsStoreIsLoading.set(false);
	}
}
