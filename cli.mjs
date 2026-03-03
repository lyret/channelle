import { BroadcastChannel } from "broadcast-channel";
import { createConfiguration } from "./_createConfiguration.mjs";
import { createStageInterfaceBuildContext } from "./_createStageInterfaceBuildContext.mjs";
import { createStageServerBuildContext } from "./_createStageServerBuildContext.mjs";
import { createTheaterServerBuildContext } from "./_createTheaterServerBuildContext.mjs";
import { createTheaterInterfaceBuildContext } from "./_createTheaterInterfaceBuildContext.mjs";
import { runStageServerCode } from "./_runStageServerCode.mjs";
import { runTheaterServerCode } from "./_runTheaterServerCode.mjs";
import { rewriteEnvironment } from "./_rewriteEnvironment.mjs";

// Create the global runtime configuration
const CONFIG = createConfiguration();

// Open a Broadcast Channel used for IPC messages that lets a stage
// be controlled from a separate theater process and send build events while
// developing.
const _cliChannel = new BroadcastChannel(CONFIG.ipc.secret);

// ------------------------------------------
// On file execution
// ------------------------------------------

if (CONFIG.runtime.theater) {
	// Theater mode - build and run theater-server and theater-interface
	// Also build stage interface once so both are available
	// Stage Interface (build once for theater mode)
	if (CONFIG.runtime.build || CONFIG.runtime.watch) {
		try {
			const stageInterfaceContext = await createStageInterfaceBuildContext(CONFIG);
			await stageInterfaceContext.rebuild();
			await stageInterfaceContext.dispose();
			console.log("✅ Stage interface built successfully");
		} catch (err) {
			console.error("❌ Failed to build stage interface:", err);
			// Don't exit, continue with theater build
		}
	}

	// Theater Interface
	if (CONFIG.runtime.watch) {
		try {
			const theaterInterfaceContext = await createTheaterInterfaceBuildContext(CONFIG, (results) => {
				if (CONFIG.runtime.start && CONFIG.runtime.debug && results.metafile) {
					_cliChannel.postMessage({
						type: "new-build-available",
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
					_cliChannel.postMessage({
						type: "new-build-available",
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

// Use the broadcast channel to rewrite the show id and rebuild if requested through IPC
if (CONFIG.ipc.secret && !CONFIG.runtime.theater) {
	_cliChannel.addEventListener("message", ({ type, data }) => {
		switch (type) {
			case "rebuild-with-show-id":
				console.log("HERE FIXME:", data);
				//rewriteEnvironment(data.showId);
				break;
			// Unhandled messages
			default:
				break;
		}
	});
}
