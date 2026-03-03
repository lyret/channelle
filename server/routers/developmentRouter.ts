import { tracked } from "@trpc/server";
import Emittery from "emittery";
import { BroadcastChannel } from "broadcast-channel";
import { trpc } from "../lib";

// Get the trcp router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/** Counts the number of times the rebuild message has been received, which happens when the client side code has been rebuiled */
let _buildCounter = 0;

/** Internal event emitter */
const _emitter = new Emittery<{ buildCounter: number }>();

/** Inter-process communication channel */
const _cliChannel = new BroadcastChannel<{ type: "new-build-available"; data: any }>(CONFIG.ipc.secret);

// Listen to build events from the cli process
_cliChannel.addEventListener("message", ({ type }) => {
	switch (type) {
		// Refresh the build counter for connected clients
		case "new-build-available":
			_buildCounter = _buildCounter + 1;
			_emitter.emit("buildCounter", _buildCounter);
			break;
		// Unhandled messages
		default:
			break;
	}
});

/**
 * Development Router
 * Handles incomming messages from the cli to the browser client over trpc
 */
export const developmentRouter = trcpRouter({
	buildCounter: trcpProcedure.subscription(async function* () {
		// listen for new events
		for await (const counter of _emitter.events("buildCounter")) {
			console.log(`[IPC] Build counter increased to ${counter}`);
			yield tracked(String(counter), counter);
		}
	}),
});

/** Debug Router Definition */
export type DebugRouter = typeof developmentRouter;
