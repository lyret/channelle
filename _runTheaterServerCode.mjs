import Chalk from "chalk";
import ChildProcess from "node:child_process";
import Path from "node:path";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/** Currently running theater-server process reference, if any */
let RUNNING_THEATER_SERVER;

/**
 * Currently running theater-server process promise, if any
 * awaited to make sure that the previous process
 * has ended
 */
let RUNNING_THEATER_SERVER_PROMISE;

/** Delay before relaunching a crashed theater-server, in milliseconds */
const RELAUNCH_DELAY = 2000;

/**
 * Creates a abortable child process executing the built version of the theater-server code
 * @param {CONFIG} CONFIG - The runtime context
 */
export async function runTheaterServerCode(CONFIG) {
	try {
		// Signal any ongoing process to end
		if (RUNNING_THEATER_SERVER) {
			RUNNING_THEATER_SERVER.kill("SIGTERM");
			RUNNING_THEATER_SERVER = undefined;
		}

		// Wait for any ongoing process to end
		// before continuing
		if (RUNNING_THEATER_SERVER_PROMISE) {
			await RUNNING_THEATER_SERVER_PROMISE;
			RUNNING_THEATER_SERVER_PROMISE = undefined;
		}

		// Create a new theater-server process
		RUNNING_THEATER_SERVER_PROMISE = new Promise((resolve) => {
			console.log("\n🎭", Chalk.white.bgMagenta("[THEATER-SERVER]"), Chalk.bold("Launching\n"));

			// Create subprocess arguments
			const args = [];

			// Enable debugging arguments
			if (CONFIG.runtime.debug) {
				args.push("--enable-source-maps");
			}

			// Add the script path
			args.push(Path.resolve(process.cwd(), CONFIG.build.serverOutput + "/index.mjs"));

			// Spawn the theater-server process
			const child = ChildProcess.spawn("node", args);
			RUNNING_THEATER_SERVER = child;

			child.stdout.on("data", (data) => {
				process.stdout.write(data);
			});

			child.stderr.on("data", (data) => {
				process.stderr.write(data);
			});

			child.on("close", (code, signal) => {
				if (code) {
					console.log("\n💥", Chalk.white.bgRed("[THEATER-SERVER]"), Chalk.bold(`Exited with code ${code}\n`));
					resolve(code);
				} else {
					console.log("\n🎭", Chalk.white.bgMagenta("[THEATER-SERVER]"), Chalk.bold("Exited\n"));
					resolve(undefined);
				}

				// Relaunch on crash or external kill, unless this process was replaced or stopped on purpose
				if ((code || signal) && RUNNING_THEATER_SERVER === child) {
					setTimeout(() => {
						if (RUNNING_THEATER_SERVER === child) {
							runTheaterServerCode(CONFIG);
						}
					}, RELAUNCH_DELAY);
				}
			});
		});
	} catch (err) {
		console.error("[THEATER-SERVER] Unable to execute the transpiled theater-server code");
		console.error(err);
		process.exit(1);
	}
}
