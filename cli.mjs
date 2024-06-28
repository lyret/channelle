// TODO: Default Lyret setup, currently unused

// import Esbuild from "esbuild";
// import EsExecStart from "@es-exec/esbuild-plugin-start";
// import EsbuildSvelte from "esbuild-svelte";
// import SveltePreprocess from "svelte-preprocess";
// import PostCSS from "esbuild-style-plugin";
// import TailwindCSS from "tailwindcss";
// import AutoPrefixer from "autoprefixer";
// import { program } from "commander";
// import Fs from "node:fs";
// import Path from "node:path";
// import Config from "./config.mjs";
//
// /** Defines the CLI program options */
// async function runProgram() {
// 	// Parse the package.json file
// 	const pkg = JSON.parse(Fs.readFileSync(Path.resolve("package.json")));
//
// 	// Define the program
// 	program.name(pkg.name).description(pkg.description);
//
// 	// Add rebuild option
// 	program.option(
// 		"-b, --build",
// 		"rebuilds the server side before code executing it"
// 	);
//
// 	// Add watch option
// 	program.option(
// 		"-w, --watch",
// 		"watches the source code for changes and rebuilds them"
// 	);
//
// 	// Add verbose warnings option
// 	program.option("-v, --verbose", "enables more verbose debug messaging");
//
// 	// Add production option
// 	program.option(
// 		"-p, --production",
// 		"optimizes the program for production usage"
// 	);
//
// 	// Add start command
// 	program
// 		.command("start", { isDefault: true })
// 		.description("starts the server")
// 		.action(async () => {
// 			// Create the context
// 			const context = await createRuntimeContext(true);
//
// 			// Watch server and client code for changes
// 			if (context.options.watch) {
// 				await context.watchClient();
// 				await context.watchServer();
// 			}
// 			// Build both server and client once
// 			else if (context.options.build) {
// 				await context.buildClient();
// 				await context.buildServer();
// 			}
// 			// Import and start the server directly
// 			else {
// 				try {
// 					await import("./.bin/server.js");
// 				} catch (err) {
// 					console.error(
// 						"Unable to execute the transpiled server side code"
// 					);
// 					console.error(err);
// 				}
// 			}
// 		});
//
// 	// Add build command
// 	program
// 		.command("build")
// 		.description("transpilies the source code")
// 		.action(async () => {
// 			// Create the context
// 			const context = await createRuntimeContext(false);
//
// 			// Watch server and client code for changes
// 			if (context.options.watch) {
// 				await context.watchClient();
// 				await context.watchServer();
// 			}
// 			// Build both server and client once
// 			else {
// 				await context.buildClient();
// 				await context.buildServer();
// 			}
// 		});
//
// 	// Parse the given CLI command and options
// 	program.program.parse();
// }
//
// /** Creates and returns a runtime context including any given CLI options */
// async function createRuntimeContext(runServer) {
// 	// Get the given cli options
// 	const options = program.opts();
//
// 	// Get the appropriate configuration
// 	const config = Config(options.production, options.verbose);
//
// 	// Return the context
// 	return {
// 		/** Given CLI options */
// 		options,
// 		/** Current configuration */
// 		config,
// 		/** Transpiles and bundles the server side code once */
// 		buildServer: async () => {
// 			try {
// 				console.log("Building server code");
// 				const serverContext = await createServerBuildContext(
// 					config,
// 					runServer
// 				);
// 				await serverContext.rebuild();
// 				await serverContext.dispose();
// 			} catch (err) {
// 				console.error("The server code is uncompliable");
// 				console.error(err);
// 			}
// 		},
// 		/** Transpiles and bundles the client/browser code once */
// 		buildClient: async () => {
// 			try {
// 				console.log("Building client code");
// 				const clientContext = await createClientBuildContext(config);
// 				await clientContext.rebuild();
// 				await clientContext.dispose();
// 			} catch (err) {
// 				console.error("The client code is uncompliable");
// 				console.error(err);
// 			}
// 		},
// 		/** Watch the server code for changes and rebuild it when changes are detected */
// 		watchServer: async () => {
// 			try {
// 				console.log("Watching server code for changes");
// 				const serverContext = await createServerBuildContext(
// 					config,
// 					runServer
// 				);
// 				await serverContext.watch();
// 			} catch (err) {
// 				console.error("The server code is uncompliable");
// 				console.error(err);
// 			}
// 		},
// 		/** Watch the server code for changes and rebuild it when changes are detected */
// 		watchClient: async () => {
// 			try {
// 				console.log("Watching client code for changes");
// 				const clientContext = await createClientBuildContext(config);
// 				await clientContext.watch();
// 			} catch (err) {
// 				console.error("The client code is uncompliable");
// 				console.error(err);
// 			}
// 		},
// 	};
// }
//
// /** Creates the build context for building the client code using the given config */
// async function createClientBuildContext(config) {
// 	return Esbuild.context({
// 		logLevel: config.isProduction
// 			? "info"
// 			: config.debug.verboseOutput
// 				? "warning"
// 				: "error",
// 		entryPoints: ["./client/client.ts"],
// 		outdir: "./.bin",
// 		platform: "browser",
// 		conditions: ["svelte"],
// 		minify: false,
// 		define: {
// 			CONFIG: JSON.stringify(config),
// 		},
// 		metafile: !config.isProduction,
// 		sourcemap: !config.isProduction,
// 		bundle: true,
// 		write: true,
// 		treeShaking: true,
// 		loader: {
// 			".svg": "dataurl",
// 		},
// 		plugins: [
// 			PostCSS({
// 				postcss: {
// 					plugins: [TailwindCSS, AutoPrefixer],
// 				},
// 			}),
// 			EsbuildSvelte({
// 				compilerOptions: {
// 					enableSourcemap: !config.isProduction,
// 					generate: "dom",
// 					css: "external",
// 					hydratable: false,
// 				},
// 				preprocess: SveltePreprocess({
// 					postcss: {
// 						plugins: [TailwindCSS, AutoPrefixer],
// 					},
// 				}),
// 			}),
// 		],
// 	});
// }
//
// /** Creates the build context for building the server code using the given config */
// async function createServerBuildContext(config, runServer) {
// 	const plugins = runServer
// 		? [
// 				EsExecStart({
// 					verbose: false,
// 					script: "node ./.bin/server.js",
// 				}),
// 			]
// 		: [];
//
// 	return Esbuild.context({
// 		logLevel: config.isProduction
// 			? "info"
// 			: config.debug.verboseOutput
// 				? "warning"
// 				: "error",
// 		entryPoints: ["./server/server.ts"],
// 		outdir: "./.bin",
// 		packages: "external",
// 		format: "esm",
// 		platform: "node",
// 		minify: false,
// 		define: {
// 			CONFIG: JSON.stringify(config),
// 		},
// 		metafile: true,
// 		sourcemap: !config.isProduction,
// 		bundle: true,
// 		write: true,
// 		plugins,
// 	});
// }
//
// // ------------------------------------------
// // On file execution
// // ------------------------------------------
// runProgram();
// // ------------------------------------------
