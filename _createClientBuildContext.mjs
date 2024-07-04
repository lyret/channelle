import Esbuild from 'esbuild';
import EsbuildSvelte from 'esbuild-svelte';
import { sassPlugin as EsbuildSass } from 'esbuild-sass-plugin';
import SveltePreprocess from 'svelte-preprocess';
import Path from 'node:path';

/** Creates the build context for building the client code using the given config */
export async function createClientBuildContext(config) {
	const { default: EsbuildHtml } = await import('@chialab/esbuild-plugin-html');

	return Esbuild.context({
		publicPath: '/',
		bundle: true,
		write: true,
		sourcemap: true,
		metafile: true,
		minify: config.isProduction,
		platform: 'browser',
		external: ['url'],
		logLevel: config.isProduction
			? 'info'
			: config.debug.verboseOutput
				? 'warning'
				: 'error',
		entryPoints: ['./ui/index.html'],
		outfile: Path.resolve(
			process.cwd(),
			config.build.clientOutput,
			'index.html'
		),
		define: {
			CONFIG: JSON.stringify(config),
		},
		treeShaking: true,
		conditions: ['svelte'],
		loader: {
			'.jpg': 'file',
			'.png': 'file',
			'.ttf': 'file',
			'.otf': 'file',
			'.svg': 'file',
		},
		plugins: [
			EsbuildHtml(),
			EsbuildSass(),
			EsbuildSvelte({
				compilerOptions: {
					enableSourcemap: true,
				},
				preprocess: SveltePreprocess(),
			}),
		],
	});
}
