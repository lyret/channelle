import Chalk from "chalk";
import Esbuild from "esbuild";
import { copy as EsbuildCopy } from "esbuild-plugin-copy";
import EsbuildSVG from "esbuild-plugin-svg";
import { sassPlugin as EsbuildSass } from "esbuild-sass-plugin";
import EsbuildSvelte from "esbuild-svelte";
import Path from "node:path";
import * as Sass from "sass";
import SvelteConfig from "./svelte.config.mjs";
import chokidar from "chokidar";
import fs from "node:fs/promises";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/**
 * Creates the build context for building the client code using the given config
 * @param {CONFIG} CONFIG - The runtime context
 */
export async function createClientBuildContext(CONFIG, callback) {
	const { default: EsbuildHtml } = await import("@chialab/esbuild-plugin-html");

	const context = await Esbuild.context({
		publicPath: "/",
		bundle: true,
		write: true,
		sourcemap: CONFIG.runtime.debug,
		metafile: true,
		minify: CONFIG.runtime.production,
		platform: "browser",
		external: ["url"],
		logLevel: CONFIG.runtime.verbose ? "warning" : "error",
		entryPoints: CONFIG.build.clientInputs.map((path) => `./ui/${path}`),
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
				watch: false, // Disable esbuild-plugin-copy's watch since we handle it ourselves
			}),
			{
				name: "EsbuildCallback",
				setup(build) {
					build.onEnd((results) => {
						if (results.metafile?.outputs[".dist/ui/index.html"] && results.metafile?.outputs[".dist/ui/_index.js"]) {
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

	// Add custom watch method that uses chokidar
	context.customWatch = async function () {
		// Perform initial build
		await context.rebuild();

		// Set up chokidar watcher for the ui directory
		const watcher = chokidar.watch("./ui", {
			ignored: [
				/(^|[/\\])\../, // Ignore dotfiles
				/node_modules/, // Ignore node_modules
				/\.dist/, // Ignore build output
			],
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 100,
				pollInterval: 100,
			},
		});

		let rebuildTimeout = null;
		let isRebuilding = false;

		// Helper function to copy static files
		const copyStaticFile = async (sourcePath) => {
			if (sourcePath.startsWith("ui/static/")) {
				const relativePath = sourcePath.replace("ui/static/", "");
				const destPath = Path.resolve(process.cwd(), CONFIG.build.clientOutput, "static", relativePath);

				try {
					// Ensure destination directory exists
					await fs.mkdir(Path.dirname(destPath), { recursive: true });
					// Copy the file
					await fs.copyFile(sourcePath, destPath);

					if (CONFIG.runtime.verbose) {
						console.log(Chalk.gray(`[STATIC] Copied ${sourcePath} -> ${destPath}`));
					}
				} catch (error) {
					console.error(Chalk.red(`[STATIC ERROR] Failed to copy ${sourcePath}:`), error);
				}
			}
		};

		const triggerRebuild = async (event, path) => {
			// Clear any pending rebuild
			if (rebuildTimeout) {
				clearTimeout(rebuildTimeout);
			}

			// Debounce rapid changes
			rebuildTimeout = setTimeout(async () => {
				if (isRebuilding) {
					return;
				}

				isRebuilding = true;

				if (CONFIG.runtime.verbose) {
					console.log(Chalk.gray(`[WATCH] ${event}: ${path}`));
				}

				try {
					// Handle static files separately
					if (path.startsWith("ui/static/")) {
						if (event === "add" || event === "change") {
							await copyStaticFile(path);
						} else if (event === "unlink") {
							// Remove deleted static file from output
							const relativePath = path.replace("ui/static/", "");
							const destPath = Path.resolve(process.cwd(), CONFIG.build.clientOutput, "static", relativePath);
							try {
								await fs.unlink(destPath);
								if (CONFIG.runtime.verbose) {
									console.log(Chalk.gray(`[STATIC] Removed ${destPath}`));
								}
							} catch {
								// File might not exist, ignore error
							}
						}
					} else {
						// For non-static files, trigger a full rebuild
						await context.rebuild();
					}
				} catch (error) {
					console.error(Chalk.red("[BUILD ERROR]"), error);
				} finally {
					isRebuilding = false;
				}
			}, 50); // 50ms debounce
		};

		// Watch for all file changes
		watcher
			.on("add", (path) => triggerRebuild("add", path))
			.on("change", (path) => triggerRebuild("change", path))
			.on("unlink", (path) => triggerRebuild("unlink", path))
			.on("addDir", (path) => triggerRebuild("addDir", path))
			.on("unlinkDir", (path) => triggerRebuild("unlinkDir", path))
			.on("error", (error) => console.error(Chalk.red("[WATCH ERROR]"), error))
			.on("ready", () => {
				console.log(Chalk.yellow("👁️  Watching for changes in ui directory..."));
			});

		// Store watcher reference for cleanup
		context._watcher = watcher;
	};

	// Override dispose to also close the chokidar watcher
	const originalDispose = context.dispose;
	context.dispose = async function () {
		if (context._watcher) {
			await context._watcher.close();
		}
		return originalDispose.call(this);
	};

	return context;
}
