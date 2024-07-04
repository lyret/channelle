import Esbuild from 'esbuild';
import Path from 'node:path';

/** Creates the build context for building the server code using the given config */
export async function createServerBuildContext(config) {
	return Esbuild.context({
		bundle: true,
		write: true,
		minify: false,
		metafile: true,
		sourcemap: true,
		platform: 'node',
		packages: 'external',
		logLevel: config.isProduction
			? 'info'
			: config.debug.verboseOutput
				? 'warning'
				: 'error',
		entryPoints: ['./server/index.ts'],
		outfile: Path.resolve(process.cwd(), config.build.serverOutput, 'index.js'),
		define: {
			CONFIG: JSON.stringify(config),
		},
		plugins: [],
	});
}
