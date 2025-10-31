import { writable } from "svelte/store";
import { stageClient } from "~/api/_trpcClient";

/** Store for stage creation loading state */
export const isCreatingStage = writable<boolean>(false);

/** Store for stage creation error messages */
export const stageCreationError = writable<string>("");

/** Create a new stage */
export async function createStage(name: string): Promise<{ id: number; name: string } | null> {
	if (!name.trim()) {
		stageCreationError.set("Stage name is required");
		return null;
	}

	isCreatingStage.set(true);
	stageCreationError.set("");

	try {
		const result = await stageClient.create.mutate({
			name: name.trim(),
		});

		if (result) {
			console.log(`Created stage: ${result.name} (ID: ${result.id})`);
			return { id: result.id, name: result.name };
		}
		return null;
	} catch (error) {
		console.error("Stage creation error:", error);
		if (error instanceof Error) {
			stageCreationError.set(error.message);
		} else {
			stageCreationError.set("Failed to create stage. Please try again.");
		}
		return null;
	} finally {
		isCreatingStage.set(false);
	}
}

/** Clear stage creation error */
export function clearStageCreationError() {
	stageCreationError.set("");
}
