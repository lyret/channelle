import Emittery from "emittery";
import { BroadcastChannel } from "broadcast-channel";
import { getGlobalBackstageConfiguration } from "../../_globalBackstageData";
import type { IpcStatus } from "../../_types";
import { Show } from "../../models/Show";

/** In Memory IPC communication status */
let ipcCreatedAt: IpcStatus["createdAt"] = new Date();
let ipcEndedAt: IpcStatus["endedAt"] = undefined;

/** Inter-process communication channel */
const _cliChannel = new BroadcastChannel<{ type: "rebuild-with-show-id"; data: { showId: number } }>(CONFIG.ipc.secret);

// Event emitter for server management events
export const ipcServerEmitter = new Emittery<{
	ended: {};
	restarted: {};
}>();

/**
 * Get the current IPC Status
 */
export function getIpcStatus(): IpcStatus {
	return {
		isStarted: true,
		createdAt: ipcCreatedAt,
		endedAt: ipcEndedAt,
		isEnded: !!ipcEndedAt,
		backstageConfiguration: getGlobalBackstageConfiguration(),
	};
}

/**
 * Ends the current show and sets the server to the not-used mode (online but the stage is not accessible)
 */
export function endCurrentShow(): void {
	console.log(`[IPC] Current show was ended`);
	ipcEndedAt = new Date();
	ipcServerEmitter.emit("ended", {});
}

/**
 * Restarts the current show without rebuilding
 */
export function restartCurrentShow(): void {
	console.log(`[IPC] Current show was restarted`);
	ipcCreatedAt = new Date();
	ipcEndedAt = undefined;
	ipcServerEmitter.emit("restarted", {});
}

/**
 * Rebuilds the server with the given show information and re-enables the server
 */
export async function rebuildWithNewShow(showId: number): Promise<boolean> {
	try {
		// Check if the show exists in the database
		const show = await Show.findByPk(showId);
		if (!show) {
			console.error(`Show with ID ${showId} does not exist in the database.`);
			return false;
		}

		console.log(`[IPC] Rebuilding with new show ID: ${showId}`);
		// Message the CLI process to rewrite the environment with the new show ID
		_cliChannel.postMessage({ type: "rebuild-with-show-id", data: { showId } });
		return true;
	} catch (error) {
		console.error("[IPC] Error when rebuilding with new show:", error.message);
		return false;
	}
}
