import type { ShowAttributes as ServerSideShowAttributes } from "../../../server/models";
import type { Optional } from "sequelize";
import { writable, derived } from "svelte/store";

// Import tRPC clients
import { showsClient } from "../_trpcClient";

// Type aliases for client-side data (dates serialized as strings)
export type ShowAttributes = Omit<ServerSideShowAttributes, "createdAt" | "updatedAt" | "lastOnlineAt"> & {
	createdAt: string;
	updatedAt: string;
	lastOnlineAt: string | null;
};

// Database-based types for creation and updates
type CreateShowData = Optional<ShowAttributes, "id" | "createdAt" | "updatedAt">;
type UpdateShowData = Partial<ShowAttributes> & { id: number };

// ============================================================================
// STORES
// ============================================================================

/** Whenever the show data is loading */
export const showsStoreIsLoading = writable<boolean>(false);

/** All available shows in the system */
export const showsListStore = writable<ShowAttributes[]>([]);

/** Contains any errors from show client operations */
export const showsErrorStore = writable<string | null>(null);

// DERIVED STORES (Convenient views of show data)

/** Shows that are currently running/online - filtered from showsStore */
export const onlineShowsStore = derived(showsListStore, ($shows) => $shows.filter((show) => show.isOnline));

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

/**
 * Get a specific show by ID
 *
 * @param id - The unique identifier of the show to fetch
 * @returns Promise<PublicShowDataResponse | null> - Show data or null if not found
 */
export async function getShow(id: number): Promise<ShowAttributes | null> {
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

/**
 * Create a new show in the system
 *
 * @param data - Show creation data
 * @returns Promise<PublicShowDataResponse | null> - Created show data or null if failed
 */
export async function createShow(data: CreateShowData): Promise<ShowAttributes | null> {
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

/**
 * Update an existing show's basic information
 *
 * @param data - Show update data with ID and fields to change
 * @returns Promise<PublicShowDataResponse | null> - Updated show data or null if failed
 */
export async function updateShow(data: UpdateShowData): Promise<ShowAttributes | null> {
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

/**
 * Delete a show from the system
 *
 * @param id - The unique identifier of the show to delete
 * @returns Promise<boolean> - true if deletion was successful
 */
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
