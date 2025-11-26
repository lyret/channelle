import Chalk from "chalk";
import ChildProcess from "node:child_process";
import Path from "node:path";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/** Currently running stage-server process reference, if any */
let RUNNING_STAGE_SERVER;

/**
 * Currently running stage-server process promise, if any
 * awaited to make sure that the previous process
 * has ended
 */
let RUNNING_STAGE_SERVER_PROMISE;

/**
 * Creates a abortable child process executing the built version of the stage-server code
 * @param {CONFIG} CONFIG - The runtime context
 */
export async function runStageServerCode(CONFIG) {
	try {
		// Signal any ongoing process to end
		if (RUNNING_STAGE_SERVER) {
			RUNNING_STAGE_SERVER.kill("SIGTERM");
			RUNNING_STAGE_SERVER = undefined;
		}

		// Wait for any ongoing process to end
		// before continuing
		if (RUNNING_STAGE_SERVER_PROMISE) {
			await RUNNING_STAGE_SERVER_PROMISE;
			RUNNING_STAGE_SERVER_PROMISE = undefined;
		}

		// Create a new stage-server process
		RUNNING_STAGE_SERVER_PROMISE = new Promise((resolve) => {
			console.log("\n🪁", Chalk.white.bgMagenta(`[${CONFIG.package.name.toUpperCase()}]`), Chalk.bold("Launching\n"));
			if (CONFIG.web.host == "localhost") {
				console.log("\n🪁", Chalk.white.bgMagenta(`[${CONFIG.package.name.toUpperCase()}]`), Chalk.bold(`Open: http://localhost:${CONFIG.web.port}\n`));
			}

			// Create subprocess arguments
			const args = [];

			// Enable debugging arguments
			if (CONFIG.runtime.debug) {
				args.push("--enable-source-maps");
			}

			// Add the script path
			args.push(Path.resolve(process.cwd(), CONFIG.build.serverOutput + "/index.mjs"));

			// Spawn the stage-server
			RUNNING_STAGE_SERVER = ChildProcess.spawn("node", args);

			RUNNING_STAGE_SERVER.stdout.on("data", (data) => {
				process.stdout.write(data);
			});

			RUNNING_STAGE_SERVER.stderr.on("data", (data) => {
				process.stderr.write(data);
			});

			RUNNING_STAGE_SERVER.on("close", (code) => {
				if (code) {
					console.log("\n💥", Chalk.white.bgRed(`[${CONFIG.package.name.toUpperCase()}]`), Chalk.bold(`Exited with code ${code}\n`));
					resolve(code);
				} else {
					console.log("\n🪁", Chalk.white.bgMagenta(`[${CONFIG.package.name.toUpperCase()}]`), Chalk.bold("Exited\n"));
					resolve(undefined);
				}
			});
		});
	} catch (err) {
		console.error(`[${CONFIG.package.name.toUpperCase()}] Unable to execute the transpiled stage-server code`);
		console.error(err);
		process.exit(1);
	}
}
