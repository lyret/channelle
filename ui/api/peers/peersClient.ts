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
		audioMuted?: boolean;
		videoMuted?: boolean;
	},
): Promise<{ success: true } | { success: false; error: string }> {
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

/**
 * Create a new peer (theater mode only)
 */
export async function createPeer(
	name: string,
	actor: boolean = true,
	manager: boolean = false,
): Promise<{ success: true; peer: any } | { success: false; error: string }> {
	try {
		const peer = await peersClient.createPeer.mutate({
			name,
			actor,
			manager,
		});
		return { success: true, peer };
	} catch (error) {
		console.error("[Peers] Error creating peer:", error);
		return { success: false, error: error instanceof Error ? error.message : String(error) };
	}
}
