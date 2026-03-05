import Emittery from "emittery";
import { BroadcastChannel } from "broadcast-channel";
import { getGlobalBackstageConfiguration } from "../../_globalBackstageData";
import type { IpcStatus } from "../../_types";
import { Show } from "../../models/Show";
import { Peer } from "../../models/Peer";
import { History } from "../../models/History";
import { generateUrlSlug } from "../../../shared/utils";

/** In Memory IPC communication status */
let ipcCreatedAt: IpcStatus["createdAt"] = new Date();
let ipcEndedAt: IpcStatus["endedAt"] = CONFIG.runtime.notUsed ? new Date() : undefined;

/** Inter-process communication channel */
const _cliChannel = new BroadcastChannel<{ type: "rebuild-with-show-id"; data: { showId: number; showName: string; showDescription: string; slug: string } }>(
	CONFIG.ipc.secret,
);

// Event emitter for server management events
export const ipcServerEmitter = new Emittery<{
	ended: {};
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
export async function endCurrentShow(): Promise<void> {
	// Get the current show configuration
	const config = getGlobalBackstageConfiguration();

	const status = getIpcStatus();

	if (status.isEnded) {
		console.log(`[IPC] Current show is already ended`);
		return;
	}

	if (config.showId) {
		try {
			// Count peers by role
			const { actors, visitors, admins } = await _countPeersByRole(config.showId);

			// Calculate duration in minutes
			const startedAt = ipcCreatedAt;
			const endedAt = new Date();

			const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60));

			// Create history record
			await History.create({
				showId: config.showId,
				showName: config.name,
				showDescription: config.description,
				script: config.script || null,
				startedAt,
				endedAt,
				duration: durationMinutes,
				nrOfActors: actors,
				nrOfVisitors: visitors,
				nrOfAdmins: admins,
			});

			console.log(`[IPC] History record created for show ${config.name} (ID: ${config.showId})`);
		} catch (error) {
			console.error(`[IPC] Error creating history record:`, error);
		}
	}

	ipcEndedAt = new Date();
	ipcServerEmitter.emit("ended", {});
	console.log(`[IPC] Current show was ended`);
}

/**
 * Rebuilds the server with the given show information and re-enables the server
 */
export async function rebuildWithNewShow(showId: number): Promise<boolean> {
	try {
		// End any ongoing show
		const status = getIpcStatus();
		if (!status.isEnded) {
			await endCurrentShow();
		}

		// Check if the show exists in the database
		const show = await Show.findByPk(showId);
		if (!show) {
			console.error(`Show with ID ${showId} does not exist in the database.`);
			return false;
		}

		console.log(`[IPC] Rebuilding with new show ID: ${showId}`);
		// Message the CLI process to rewrite the environment with the new show ID
		_cliChannel.postMessage({
			type: "rebuild-with-show-id",
			data: { showId, showName: show.name, showDescription: show.description, slug: generateUrlSlug(show) },
		});
		return true;
	} catch (error) {
		console.error("[IPC] Error when rebuilding with new show:", error.message);
		return false;
	}
}

/**
 * Utility function that counts all peers by their roles for statistics
 */
async function _countPeersByRole(showId: number): Promise<{ actors: number; visitors: number; admins: number }> {
	const peers = await Peer.findAll({
		where: { showId },
	});

	let actors = 0;
	let visitors = 0;
	let admins = 0;

	for (const peer of peers) {
		if (peer.manager) {
			admins++;
		} else if (peer.actor) {
			actors++;
		} else {
			visitors++;
		}
	}

	return { actors, visitors, admins };
}
