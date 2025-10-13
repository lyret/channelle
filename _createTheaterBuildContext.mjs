import Chalk from "chalk";
import Esbuild from "esbuild";
import Path from "node:path";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/**
 * Creates the build context for building the theater code using the given config
 * @param {CONFIG} CONFIG - The runtime context
 */
export async function createTheaterBuildContext(CONFIG, callback) {
	return Esbuild.context({
		bundle: true,
		write: true,
		minify: CONFIG.runtime.production,
		metafile: true,
		sourcemap: CONFIG.runtime.debug,
		format: "esm",
		platform: "node",
		packages: "external",
		logLevel: CONFIG.runtime.verbose ? "warning" : "error",
		entryPoints: ["./theater/index.ts"],
		outfile: Path.resolve(process.cwd(), CONFIG.build.theaterOutput, "index.mjs"),
		define: {
			CONFIG: JSON.stringify(CONFIG),
		},
		plugins: [
			{
				name: "EsbuildCallback",
				setup(build) {
					build.onEnd((results) => {
						if (results.metafile?.outputs) {
							console.log("\n📦", Chalk.white.bgMagenta("[BUILD]"), Chalk.bold("New theater code available\n"));

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
