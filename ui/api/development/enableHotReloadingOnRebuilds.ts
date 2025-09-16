import { developmentClient } from "../_trpcClient";

/**
 * Enables browser reloading when the server side build counter changes during development
 */
export async function enableHotReloadingOnRebuilds() {
	// Keep track of the local build counter
	let _localBuildCounter = -1;

	if (CONFIG.isProduction) {
		return;
	}
	developmentClient.buildCounter.subscribe(undefined, {
		onData: ({ data: buildCounter }) => {
			console.log("[Dev Router] Rebuild counter:", buildCounter);
			// Reload the window if the build counter has changed during development
			if (buildCounter > _localBuildCounter && _localBuildCounter != -1) {
				console.log("[Dev Router] Reloading...");
				window.location.reload();
			} else {
				_localBuildCounter = buildCounter;
			}
		},
		onError: (error) => {
			console.error("[Dev Router] Error:", error);
		},
		onStarted: () => {
			console.log("[Dev Router] Connected");
		},
		onComplete: () => {
			console.log("[Dev Router] Completed");
		},
	});
}
