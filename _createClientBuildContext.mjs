import Chalk from "chalk";
import Esbuild from "esbuild";
import { copy as EsbuildCopy } from "esbuild-plugin-copy";
import EsbuildSVG from "esbuild-plugin-svg";
import { sassPlugin as EsbuildSass } from "esbuild-sass-plugin";
import EsbuildSvelte from "esbuild-svelte";
import Path from "node:path";
import * as Sass from "sass";
import SvelteConfig from "./svelte.config.mjs";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/**
 * Creates the build context for building the client code using the given config
 * @param {CONFIG} CONFIG - The runtime context
 */
export async function createClientBuildContext(CONFIG, callback) {
	const { default: EsbuildHtml } = await import("@chialab/esbuild-plugin-html");

	return Esbuild.context({
		publicPath: "/",
		bundle: true,
		write: true,
		sourcemap: CONFIG.runtime.debug,
		metafile: true,
		format: "esm",
		minify: CONFIG.runtime.production,
		platform: "browser",
		external: ["url"],
		logLevel: CONFIG.runtime.verbose ? "warning" : "error",
		entryPoints: ["./ui/index.html", "./ui/_main.ts"],
		outdir: Path.resolve(process.cwd(), CONFIG.build.clientOutput),
		define: {
			CONFIG: JSON.stringify(CONFIG),
		},
		treeShaking: true,
		conditions: ["svelte"],
		loader: {
			".base64": "dataurl",
			".jpg": "file",
			".png": "file",
			".gif": "file",
			".ttf": "file",
			".otf": "file",
			".mp4": "file",
			".wav": "file",
		},
		plugins: [
			EsbuildSVG(),
			EsbuildHtml(),
			EsbuildSass({
				logger: !CONFIG.runtime.verbose && Sass.Logger.silent,
				verbose: false,
				quietDeps: true,
			}),
			EsbuildSvelte(SvelteConfig),
			EsbuildCopy({
				verbose: CONFIG.runtime.verbose,
				resolveFrom: "cwd",
				assets: {
					from: ["ui/static/**/*"],
					to: [".dist/ui/static"],
				},
				watch: true,
			}),
			{
				name: "EsbuildCallback",
				setup(build) {
					build.onEnd((results) => {
						if (results.metafile?.outputs[".dist/ui/index.html"] && results.metafile?.outputs[".dist/ui/_main.js"]) {
							console.log("\n📦", Chalk.white.bgGreen("[BUILD]"), Chalk.bold("New client code available\n"));

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
