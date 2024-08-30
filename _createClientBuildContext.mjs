import Chalk from 'chalk';
import Esbuild from 'esbuild';
import EsbuildSvelte from 'esbuild-svelte';
import { sassPlugin as EsbuildSass } from 'esbuild-sass-plugin';
import SveltePreprocess from 'svelte-preprocess';
import Path from 'node:path';

/** Creates the build context for building the client code using the given config */
export async function createClientBuildContext(CONFIG, callback) {
	const { default: EsbuildHtml } = await import('@chialab/esbuild-plugin-html');

	return Esbuild.context({
		publicPath: '/',
		bundle: true,
		write: true,
		sourcemap: CONFIG.runtime.debug,
		metafile: true,
		minify: CONFIG.runtime.production,
		platform: 'browser',
		external: ['url'],
		logLevel: CONFIG.runtime.production
			? 'info'
			: CONFIG.runtime.verbose
				? 'warning'
				: 'error',
		entryPoints: ['./ui/index.html', './ui/_main.ts'],
		outdir: Path.resolve(process.cwd(), CONFIG.build.clientOutput),
		define: {
			CONFIG: JSON.stringify(CONFIG),
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
			{
				name: 'EsbuildCallback',
				setup(build) {
					build.onEnd((results) => {
						if (
							results.metafile?.outputs['.dist/ui/index.html'] &&
							results.metafile?.outputs['.dist/ui/_main.js']
						) {
							console.log(
								'\n📦',
								Chalk.white.bgGreen('[BUILD]'),
								Chalk.bold('New client code available\n')
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
