import Chalk from 'chalk';
import Esbuild from 'esbuild';
import Path from 'node:path';

/** Creates the build context for building the server code using the given config */
export async function createServerBuildContext(CONFIG, callback) {
	return Esbuild.context({
		bundle: true,
		write: true,
		minify: CONFIG.runtime.production,
		metafile: true,
		sourcemap: CONFIG.runtime.debug,
		platform: 'node',
		packages: 'external',
		logLevel: CONFIG.runtime.production
			? 'info'
			: CONFIG.runtime.verbose
				? 'warning'
				: 'error',
		entryPoints: ['./server/index.ts'],
		outfile: Path.resolve(process.cwd(), CONFIG.build.serverOutput, 'index.js'),
		define: {
			CONFIG: JSON.stringify(CONFIG),
		},
		plugins: [
			{
				name: 'EsbuildCallback',
				setup(build) {
					build.onEnd((results) => {
						if (results.metafile?.outputs) {
							console.log(
								'\n📦',
								Chalk.white.bgGreen('[BUILD]'),
								Chalk.bold('New server code available\n')
							);

							if (callback) {
								callback(results);
							}
						}
					});
				},
			},
		],
	});
}
