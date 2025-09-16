import { trpc } from "../../lib";
import { BroadcastChannel } from "broadcast-channel";
import { EventEmitter, on } from "node:events";

// Get the trcp router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/** Number of times the build counter has been incremented, happens when the client side code has been rebuiled */
let _buildCounter = 0;

/** Inter-process communication channel */
const _debugChannel = new BroadcastChannel<{ type: "build-event"; data: any }>("cli-channel");

/** Local event emitter */
const _ee = new EventEmitter<{
	buildCounter: [buildCounter: number];
}>();

_debugChannel.addEventListener("message", ({ type }) => {
	switch (type) {
		// Refresh the build counter for connected clients
		case "build-event":
			_buildCounter++;
			_ee.emit("buildCounter", _buildCounter);
			break;
		// Unhandled messages
		default:
			console.log(`[DEBUG] Received unhandled IPC message of type: ${type}`);
			break;
	}
});

/**
 * Debug Router
 * Handles incomming debugging messages from the cli to the browser client over trpc
 */
export const debugRouter = trcpRouter({
	buildCounter: trcpProcedure.subscription(async function* () {
		// listen for new events
		for await (const [counter] of on(_ee, "buildCounter")) {
			console.log(`[DEBUG ROUTER] Debug counter increased: ${counter}`);
			yield counter;
		}
	}),
});

/** Debug Router Definition */
export type DebugRouter = typeof debugRouter;
