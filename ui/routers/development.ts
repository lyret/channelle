import { debugClient } from "./_trpcClient";

/** Keep track of the local build counter */
let _localBuildCounter = -1;

/**
 * Enables browser reloading when the server side build counter changes during development
 */
export async function enableHotReloadingOnRebuilds() {
	if (CONFIG.isProduction) {
		return;
	}
	debugClient.buildCounter.subscribe(undefined, {
		onData: ({ data: buildCounter }) => {
			console.log("Build counter:", buildCounter);
			// Reload the window if the build counter has changed during development
			if (buildCounter > _localBuildCounter && _localBuildCounter != -1) {
				window.location.reload();
			} else {
				_localBuildCounter = buildCounter;
			}
		},
		onError: (error) => {
			console.error("Build counter error:", error);
		},
		onStarted: () => {
			console.log("Build counter started");
		},
		onComplete: () => {
			console.log("Build counter completed");
		},
	});
}
