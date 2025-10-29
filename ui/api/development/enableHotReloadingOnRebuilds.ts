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
				// TODO: Only reload CSS code if possible, requries some more tinkering
				// to get working
				// for (const link of Array.from(document.querySelectorAll('link'))) {
				// 	const url = new URL(link.href);
				// 	for (const outputPath of Object.keys(buildOutputs)) {
				// 		if (
				// 			url.host === location.host &&
				// 			`${CONFIG.build.interfaceOutput}${url.pathname}` == outputPath
				// 		) {
				// 			// Create a new link element for the css, load it and delete
				// 			// the previous link element
				// 			const nextHref = outputPath.split('/').splice(-1)[0];
				// 			console.log(nextHref);
				// 			const nextElement = link.cloneNode() as HTMLLinkElement;
				// 			nextElement.href =
				// 				nextHref + ('?' + Math.random().toString(36).slice(2));
				// 			nextElement.onload = () => link.remove();
				// 			link.parentNode?.insertBefore(nextElement, link.nextSibling);
				// 			return;
				// 		}
				// 	}
				// }
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
