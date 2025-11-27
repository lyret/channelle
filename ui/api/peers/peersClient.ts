import { peersClient } from "../_trpcClient";

/**
 * Update a peer's information
 */
export async function updatePeer(
	peerId: string,
	updates: {
		name?: string;
		actor?: boolean;
		manager?: boolean;
		banned?: boolean;
	},
): Promise<{ success: true } | { success: false, error: string }> {
	try {
		await peersClient.updatePeer.mutate({
			id: peerId,
			...updates,
		});
		return { success: true };
	} catch (error) {
		console.error("[Peers] Error updating peer:", error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}
