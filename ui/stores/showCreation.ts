import { writable } from "svelte/store";
import { createShow } from "~/api/config";

/** Store for show creation loading state */
export const isCreatingShow = writable<boolean>(false);

/** Store for show creation error messages */
export const showCreationError = writable<string>("");

/** Create a new show */
export async function createShowLocal(name: string): Promise<{ id: number; name: string } | null> {
	if (!name.trim()) {
		showCreationError.set("Show name is required");
		return null;
	}

	isCreatingShow.set(true);
	showCreationError.set("");

	try {
		const result = await createShow({
			name: name.trim(),
		});

		if (result) {
			console.log(`Created show: ${result.name} (ID: ${result.id})`);
			return { id: result.id, name: result.name };
		}
		return null;
	} catch (error) {
		console.error("Show creation error:", error);
		if (error instanceof Error) {
			showCreationError.set(error.message);
		} else {
			showCreationError.set("Failed to create show. Please try again.");
		}
		return null;
	} finally {
		isCreatingShow.set(false);
	}
}

/** Clear show creation error */
export function clearShowCreationError() {
	showCreationError.set("");
}
