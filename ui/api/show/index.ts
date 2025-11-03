import { writable, derived } from "svelte/store";
import { showClient } from "../_trpcClient";
import type { ShowListItem, CreateShowData, UpdateShowData, PublicShowDataResponse, ShowAuthResponseClient } from "../../../shared/types/show";

/** Store for all available shows */
export const showsStore = writable<ShowListItem[]>([]);

/** Loading state for shows operations */
export const showsLoadingStore = writable<boolean>(false);

/** Error state for shows operations */
export const showsErrorStore = writable<string | null>(null);

/** Currently selected/active show */
export const currentShowStore = writable<PublicShowDataResponse>({
	id: -1,
	name: "(laddar)",
	description: "(laddar)",
	nomenclature: "föreställningen",
	isPasswordProtected: false,
	curtainsOverride: 0,
	chatEnabledOverride: 0,
	effectsEnabledOverride: 0,
	visitorAudioEnabledOverride: 0,
	visitorVideoEnabledOverride: 0,
	currentScene: null,
	createdAt: new Date().toString(),
	updatedAt: new Date().toString(),
});

/** Derived store for online shows only */
export const onlineShowsStore = derived(showsStore, ($shows) => $shows.filter((show) => show.isOnline));

/** Derived store for password-protected shows */
export const protectedShowsStore = derived(showsStore, ($shows) => $shows.filter((show) => show.isPasswordProtected));

/** Derived store for public shows */
export const publicShowsStore = derived(showsStore, ($shows) => $shows.filter((show) => !show.isPasswordProtected));

/**
 * Fetch all shows from the server
 */
export async function fetchShows(): Promise<void> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const shows = await showClient.list.query();
		showsStore.set(shows);
	} catch (error) {
		console.error("Failed to fetch shows:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to fetch shows");
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Get a specific show by ID
 */
export async function getShow(id: number): Promise<PublicShowDataResponse | null> {
	try {
		showsErrorStore.set(null);
		const show = await showClient.get.query({ id });
		return show;
	} catch (error) {
		console.error("Failed to get show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to get show");
		return null;
	}
}

/**
 * Create a new show
 */
export async function createShow(data: CreateShowData): Promise<PublicShowDataResponse | null> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const show = await showClient.create.mutate(data);

		// Refresh the shows list
		await fetchShows();

		return show;
	} catch (error) {
		console.error("Failed to create show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to create show");
		return null;
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Update an existing show
 */
export async function updateShow(data: UpdateShowData): Promise<PublicShowDataResponse | null> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const show = await showClient.update.mutate(data);

		// Refresh the shows list
		await fetchShows();

		return show;
	} catch (error) {
		console.error("Failed to update show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to update show");
		return null;
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Delete a show
 */
export async function deleteShow(id: number): Promise<boolean> {
	try {
		showsLoadingStore.set(true);
		showsErrorStore.set(null);

		const result = await showClient.delete.mutate({ id });

		// Refresh the shows list
		await fetchShows();

		return result.success;
	} catch (error) {
		console.error("Failed to delete show:", error);
		showsErrorStore.set(error instanceof Error ? error.message : "Failed to delete show");
		return false;
	} finally {
		showsLoadingStore.set(false);
	}
}

/**
 * Authenticate access to a password-protected show
 */
export async function authenticateShowAccess(showId: number, password: string): Promise<{ success: boolean; show?: PublicShowDataResponse; message?: string }> {
	try {
		showsErrorStore.set(null);

		const result = (await showClient.authenticate.mutate({ showId, password })) as ShowAuthResponseClient;

		if (result.success && result.showData) {
			currentShowStore.set(result.showData);
		}

		return {
			success: result.success,
			show: result.showData,
			message: result.message,
		};
	} catch (error) {
		console.error("Failed to authenticate show access:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to authenticate show access";
		showsErrorStore.set(errorMessage);
		return {
			success: false,
			message: errorMessage,
		};
	}
}

/**
 * Initialize the show API (call this when the app starts)
 */
export async function initializeShowAPI(): Promise<void> {
	await fetchShows();
}

/**
 * Clear all show data (useful for logout or reset)
 */
export function clearShowData(): void {
	showsStore.set([]);
	currentShowStore.set(null);
	showsErrorStore.set(null);
	showsLoadingStore.set(false);
}
