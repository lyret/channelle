import Path from 'node:path';
import ChildProcess from 'node:child_process';
import Chalk from 'chalk';

/** Currently running server process reference, if any */
let RUNNING_SERVER;

/**
 * Currently running server process promise, if any
 * awaited to make sure that the previous process
 * has ended
 */
let RUNNING_SERVER_PROMISE;

/** Creates a abortable child process executing the built version of the server side code */
export async function runServerCode(CONFIG) {
	try {
		// Signal any ongoing process to end
		if (RUNNING_SERVER) {
			RUNNING_SERVER.kill('SIGTERM');
			RUNNING_SERVER = undefined;
		}

		// Wait for any ongoing process to end
		// before continuing
		if (RUNNING_SERVER_PROMISE) {
			await RUNNING_SERVER_PROMISE;
			RUNNING_SERVER_PROMISE = undefined;
		}

		// Create a new server process
		RUNNING_SERVER_PROMISE = new Promise((resolve) => {
			console.log(
				'\n🪁',
				Chalk.white.bgMagenta(`[${CONFIG.package.name.toUpperCase()}]`),
				Chalk.bold('Launching\n')
			);

			// Create subprocess arguments
			const args = [Path.resolve(process.cwd(), CONFIG.build.serverOutput)];

			// Enable debugging arguments
			if (CONFIG.runtime.debug) {
				args.push('--enable-source-maps');
			}

			// Spawn the server
			RUNNING_SERVER = ChildProcess.spawn('node', args);

			RUNNING_SERVER.stdout.on('data', (data) => {
				process.stdout.write(data);
			});

			RUNNING_SERVER.stderr.on('data', (data) => {
				process.stderr.write(data);
			});

			RUNNING_SERVER.on('close', (code) => {
				if (code) {
					console.log(
						'\n💥',
						Chalk.white.bgRed(`[${CONFIG.package.name.toUpperCase()}]`),
						Chalk.bold(`Exited with code ${code}\n`)
					);
					resolve(code);
				} else {
					console.log(
						'\n🪁',
						Chalk.white.bgMagenta(`[${CONFIG.package.name.toUpperCase()}]`),
						Chalk.bold('Exited\n')
					);
					resolve(undefined);
				}
			});
		});
	} catch (err) {
		console.error(
			`[${CONFIG.package.name.toUpperCase()}] Unable to execute the transpiled server side code`
		);
		console.error(err);
		process.exit(1);
	}
}
