import { BroadcastChannel } from "broadcast-channel";
import { createConfiguration } from "./_createConfiguration.mjs";
import { createStageInterfaceBuildContext } from "./_createStageInterfaceBuildContext.mjs";
import { createStageServerBuildContext } from "./_createStageServerBuildContext.mjs";
import { createTheaterServerBuildContext } from "./_createTheaterServerBuildContext.mjs";
import { createTheaterInterfaceBuildContext } from "./_createTheaterInterfaceBuildContext.mjs";
import { runStageServerCode } from "./_runStageServerCode.mjs";
import { runTheaterServerCode } from "./_runTheaterServerCode.mjs";

// Create the global runtime configuration
const CONFIG = await createConfiguration();

// Create Broadcast Channel used for IPC messages regarding debugging events
const channel = new BroadcastChannel("cli-channel");

// ------------------------------------------
// On file execution
// ------------------------------------------

if (CONFIG.runtime.theater) {
	// Theater mode - build and run theater-server and theater-interface
	// Theater Interface
	if (CONFIG.runtime.watch) {
		try {
			const theaterInterfaceContext = await createTheaterInterfaceBuildContext(CONFIG, (results) => {
				if (CONFIG.runtime.start && CONFIG.runtime.debug && results.metafile) {
					channel.postMessage({
						type: "build-event",
						data: results.metafile.outputs,
					});
				}
			});
			await theaterInterfaceContext.customWatch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const theaterInterfaceContext = await createTheaterInterfaceBuildContext(CONFIG);
			await theaterInterfaceContext.rebuild();
			await theaterInterfaceContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Theater Server
	if (CONFIG.runtime.watch) {
		try {
			const theaterServerContext = await createTheaterServerBuildContext(CONFIG, () => {
				if (CONFIG.runtime.start) {
					runTheaterServerCode(CONFIG);
				}
			});
			await theaterServerContext.watch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const theaterServerContext = await createTheaterServerBuildContext(CONFIG);
			await theaterServerContext.rebuild();
			await theaterServerContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Import and start the theater-server directly
	if (CONFIG.runtime.start && !CONFIG.runtime.watch) {
		await runTheaterServerCode(CONFIG);
	}
} else {
	// Default mode - build and run stage-server and stage-interface
	// Stage Interface
	if (CONFIG.runtime.watch) {
		try {
			const stageInterfaceContext = await createStageInterfaceBuildContext(CONFIG, (results) => {
				if (CONFIG.runtime.start && CONFIG.runtime.debug && results.metafile) {
					channel.postMessage({
						type: "build-event",
						data: results.metafile.outputs,
					});
				}
			});
			await stageInterfaceContext.customWatch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const stageInterfaceContext = await createStageInterfaceBuildContext(CONFIG);
			await stageInterfaceContext.rebuild();
			await stageInterfaceContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Stage Server
	if (CONFIG.runtime.watch) {
		try {
			const stageServerContext = await createStageServerBuildContext(CONFIG, () => {
				if (CONFIG.runtime.start) {
					runStageServerCode(CONFIG);
				}
			});
			await stageServerContext.watch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const stageServerContext = await createStageServerBuildContext(CONFIG);
			await stageServerContext.rebuild();
			await stageServerContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Import and start the stage-server directly
	if (CONFIG.runtime.start && !CONFIG.runtime.watch) {
		await runStageServerCode(CONFIG);
	}
}

// Exit if neither running or watching
if (!CONFIG.runtime.start && !CONFIG.runtime.watch) {
	process.exit(0);
}

// ------------------------------------------
