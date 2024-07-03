import Path from 'node:path';
import Koa from 'koa';
import ESBuild from 'esbuild';
import sveltePreprocess from 'svelte-preprocess';
import { Config } from '../../shared';

/**
 * Generates a Koa Middleware
 * that rebundles the
 * front-end ui when run
 */
export const createBundlerMiddleware = async () => {
	// Load plugins and add loaders
	const { default: htmlPlugin } = await import('@chialab/esbuild-plugin-html');
	const { default: esbuildSvelte } = await import('esbuild-svelte');
	const { sassPlugin } = await import('esbuild-sass-plugin');

	const optionsWithPlugins: ESBuild.BuildOptions = {
		platform: 'browser',
		external: ['url'],
		loader: {
			'.jpg': 'file',
			'.png': 'file',
			'.ttf': 'file',
			'.otf': 'file',
			'.svg': 'file',
		},
		publicPath: '/',
		bundle: true,
		minify: Config.isProduction,
		sourcemap: true,
		metafile: true,
		write: true,
		outfile: Path.resolve(process.cwd(), Config.build.outDir, 'index.html'),
		logLevel: 'error',
		entryPoints: ['./ui/index.html'],
		plugins: [
			htmlPlugin(),
			sassPlugin({}),
			esbuildSvelte({
				preprocess: sveltePreprocess(),
			}),
		],
	};

	// Bundle once
	const context = await ESBuild.context(optionsWithPlugins);
	await context.rebuild();

	// Returns a middleware that re-builds on request
	return async function (ctx: Koa.Context, next: Koa.Next) {
		// Bundle on request to the main js file
		if (ctx.href.indexOf('_main.js') >= 0) {
			await context.rebuild();
		}

		await next();
	};
};
