import { writable, derived } from "svelte/store";
import { stageClient } from "../_trpcClient";
import type { StageListItem, CreateStageData, UpdateStageData, PublicStageDataResponse, StageAuthResponseClient } from "../../../shared/types/stage";

/** Store for all available stages */
export const stagesStore = writable<StageListItem[]>([]);

/** Loading state for stages operations */
export const stagesLoadingStore = writable<boolean>(false);

/** Error state for stages operations */
export const stagesErrorStore = writable<string | null>(null);

/** Currently selected/active stage */
export const currentStageStore = writable<PublicStageDataResponse | null>(null);

/** Derived store for online stages only */
export const onlineStagesStore = derived(stagesStore, ($stages) => $stages.filter((stage) => stage.isOnline));

/** Derived store for password-protected stages */
export const protectedStagesStore = derived(stagesStore, ($stages) => $stages.filter((stage) => stage.isPasswordProtected));

/** Derived store for public stages */
export const publicStagesStore = derived(stagesStore, ($stages) => $stages.filter((stage) => !stage.isPasswordProtected));

/**
 * Fetch all stages from the server
 */
export async function fetchStages(): Promise<void> {
	try {
		stagesLoadingStore.set(true);
		stagesErrorStore.set(null);

		const stages = await stageClient.list.query();
		stagesStore.set(stages);
	} catch (error) {
		console.error("Failed to fetch stages:", error);
		stagesErrorStore.set(error instanceof Error ? error.message : "Failed to fetch stages");
	} finally {
		stagesLoadingStore.set(false);
	}
}

/**
 * Get a specific stage by ID
 */
export async function getStage(id: number): Promise<PublicStageDataResponse | null> {
	try {
		stagesErrorStore.set(null);
		const stage = await stageClient.get.query({ id });
		return stage;
	} catch (error) {
		console.error("Failed to get stage:", error);
		stagesErrorStore.set(error instanceof Error ? error.message : "Failed to get stage");
		return null;
	}
}

/**
 * Create a new stage
 */
export async function createStage(data: CreateStageData): Promise<PublicStageDataResponse | null> {
	try {
		stagesLoadingStore.set(true);
		stagesErrorStore.set(null);

		const stage = await stageClient.create.mutate(data);

		// Refresh the stages list
		await fetchStages();

		return stage;
	} catch (error) {
		console.error("Failed to create stage:", error);
		stagesErrorStore.set(error instanceof Error ? error.message : "Failed to create stage");
		return null;
	} finally {
		stagesLoadingStore.set(false);
	}
}

/**
 * Update an existing stage
 */
export async function updateStage(data: UpdateStageData): Promise<PublicStageDataResponse | null> {
	try {
		stagesLoadingStore.set(true);
		stagesErrorStore.set(null);

		const stage = await stageClient.update.mutate(data);

		// Refresh the stages list
		await fetchStages();

		return stage;
	} catch (error) {
		console.error("Failed to update stage:", error);
		stagesErrorStore.set(error instanceof Error ? error.message : "Failed to update stage");
		return null;
	} finally {
		stagesLoadingStore.set(false);
	}
}

/**
 * Delete a stage
 */
export async function deleteStage(id: number): Promise<boolean> {
	try {
		stagesLoadingStore.set(true);
		stagesErrorStore.set(null);

		const result = await stageClient.delete.mutate({ id });

		// Refresh the stages list
		await fetchStages();

		return result.success;
	} catch (error) {
		console.error("Failed to delete stage:", error);
		stagesErrorStore.set(error instanceof Error ? error.message : "Failed to delete stage");
		return false;
	} finally {
		stagesLoadingStore.set(false);
	}
}

/**
 * Authenticate access to a password-protected stage
 */
export async function authenticateStageAccess(
	stageId: number,
	password: string,
): Promise<{ success: boolean; stage?: PublicStageDataResponse; message?: string }> {
	try {
		stagesErrorStore.set(null);

		const result = (await stageClient.authenticate.mutate({ stageId, password })) as StageAuthResponseClient;

		if (result.success && result.stageData) {
			currentStageStore.set(result.stageData);
		}

		return {
			success: result.success,
			stage: result.stageData,
			message: result.message,
		};
	} catch (error) {
		console.error("Failed to authenticate stage access:", error);
		const errorMessage = error instanceof Error ? error.message : "Failed to authenticate stage access";
		stagesErrorStore.set(errorMessage);
		return {
			success: false,
			message: errorMessage,
		};
	}
}

/**
 * Initialize the stage API (call this when the app starts)
 */
export async function initializeStageAPI(): Promise<void> {
	await fetchStages();
}

/**
 * Clear all stage data (useful for logout or reset)
 */
export function clearStageData(): void {
	stagesStore.set([]);
	currentStageStore.set(null);
	stagesErrorStore.set(null);
	stagesLoadingStore.set(false);
}
