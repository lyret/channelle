import Chalk from "chalk";
import ChildProcess from "node:child_process";
import Path from "node:path";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/** Currently running theater process reference, if any */
let RUNNING_THEATER;

/**
 * Currently running theater process promise, if any
 * awaited to make sure that the previous process
 * has ended
 */
let RUNNING_THEATER_PROMISE;

/**
 * Creates a abortable child process executing the built version of the theater code
 * @param {CONFIG} CONFIG - The runtime context
 */
export async function runTheaterCode(CONFIG) {
	try {
		// Signal any ongoing process to end
		if (RUNNING_THEATER) {
			RUNNING_THEATER.kill("SIGTERM");
			RUNNING_THEATER = undefined;
		}

		// Wait for any ongoing process to end
		// before continuing
		if (RUNNING_THEATER_PROMISE) {
			await RUNNING_THEATER_PROMISE;
			RUNNING_THEATER_PROMISE = undefined;
		}

		// Create a new theater process
		RUNNING_THEATER_PROMISE = new Promise((resolve) => {
			console.log("\n🎭", Chalk.white.bgMagenta("[THEATER]"), Chalk.bold("Launching\n"));

			// Create subprocess arguments
			const args = [Path.resolve(process.cwd(), CONFIG.build.theaterOutput + "/index.mjs")];

			// Enable debugging arguments
			if (CONFIG.runtime.debug) {
				args.push("--enable-source-maps");
			}

			// Spawn the theater process
			RUNNING_THEATER = ChildProcess.spawn("node", args);

			RUNNING_THEATER.stdout.on("data", (data) => {
				process.stdout.write(data);
			});

			RUNNING_THEATER.stderr.on("data", (data) => {
				process.stderr.write(data);
			});

			RUNNING_THEATER.on("close", (code) => {
				if (code) {
					console.log("\n💥", Chalk.white.bgRed("[THEATER]"), Chalk.bold(`Exited with code ${code}\n`));
					resolve(code);
				} else {
					console.log("\n🎭", Chalk.white.bgMagenta("[THEATER]"), Chalk.bold("Exited\n"));
					resolve(undefined);
				}
			});
		});
	} catch (err) {
		console.error("[THEATER] Unable to execute the transpiled theater code");
		console.error(err);
		process.exit(1);
	}
}
