import { BroadcastChannel } from "broadcast-channel";
import { createConfiguration } from "./_createConfiguration.mjs";
import { createClientBuildContext } from "./_createClientBuildContext.mjs";
import { createServerBuildContext } from "./_createServerBuildContext.mjs";
import { createTheaterBuildContext } from "./_createTheaterBuildContext.mjs";
import { runServerCode } from "./_runServerCode.mjs";
import { runTheaterCode } from "./_runTheaterCode.mjs";

// Create the global runtime configuration
const CONFIG = await createConfiguration();

// Create Broadcast Channel used for IPC messages regarding debugging events
const channel = new BroadcastChannel("cli-channel");

// ------------------------------------------
// On file execution
// ------------------------------------------

if (CONFIG.runtime.theater) {
	// Theater mode - only build and run theater
	if (CONFIG.runtime.watch) {
		try {
			const theaterContext = await createTheaterBuildContext(CONFIG, () => {
				if (CONFIG.runtime.start) {
					runTheaterCode(CONFIG);
				}
			});
			await theaterContext.watch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const theaterContext = await createTheaterBuildContext(CONFIG);
			await theaterContext.rebuild();
			await theaterContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Import and start the theater directly
	if (CONFIG.runtime.start && !CONFIG.runtime.watch) {
		await runTheaterCode(CONFIG);
	}
} else {
	// Default mode - build and run server and client
	// Client
	if (CONFIG.runtime.watch) {
		try {
			const clientContext = await createClientBuildContext(CONFIG, (results) => {
				if (CONFIG.runtime.start && CONFIG.runtime.debug && results.metafile) {
					channel.postMessage({
						type: "build-event",
						data: results.metafile.outputs,
					});
				}
			});
			await clientContext.customWatch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const clientContext = await createClientBuildContext(CONFIG);
			await clientContext.rebuild();
			await clientContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Server
	if (CONFIG.runtime.watch) {
		try {
			const serverContext = await createServerBuildContext(CONFIG, () => {
				if (CONFIG.runtime.start) {
					runServerCode(CONFIG);
				}
			});
			await serverContext.watch();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	} else if (CONFIG.runtime.build) {
		try {
			const serverContext = await createServerBuildContext(CONFIG);
			await serverContext.rebuild();
			await serverContext.dispose();
		} catch (err) {
			console.error(err);
			process.exit(1);
		}
	}

	// Import and start the server directly
	if (CONFIG.runtime.start && !CONFIG.runtime.watch) {
		await runServerCode(CONFIG);
	}
}

// Exit if neither running or watching
if (!CONFIG.runtime.start && !CONFIG.runtime.watch) {
	process.exit(0);
}

// ------------------------------------------
