import Chalk from "chalk";
import Slug from "slug";
import "dotenv/config";
import { readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import Nopt from "nopt";
import { publicIpv4 } from "public-ip";

/** @typedef {import('./shared/types/config.mjs').CONFIG} CONFIG */

/**
 * Creates and returns a runtime context including any given CLI options
 * @returns {Promise<CONFIG>} CONFIG - The runtime context
 */
export async function createConfiguration(overridenShowId) {
	// Parse environmental variables
	const { env } = process;

	// Parse Package JSON
	const pkg = JSON.parse(readFileSync("./package.json"));

	// Parse CLI Options
	// @see https://www.npmjs.com/package/nopt
	const cli = Nopt(
		{
			name: String,
			password: String,
			slug: String,
			theaterPassword: String,
			showId: Number,
			production: Boolean,
			port: Number,
			verbose: Boolean,
			debug: Boolean,
			local: Boolean,
			lan: Boolean,
			wan: Boolean,
			wanIp: String,
			build: Boolean,
			watch: Boolean,
			start: Boolean,
			theater: Boolean,
			notUsed: Boolean,
			ipcStageUrl: String,
			ipcSecret: String,
			theaterServerUrl: String,
		},
		{
			p: ["--port"],
			v: ["--verbose"],
			b: ["--build"],
			d: ["--debug"],
			w: ["--watch"],
			t: ["--theater"],
			s: ["--showId"],
		},
	);

	// Allows for manually overidable show id from parameter list
	cli.showId = overridenShowId || cli.showId;

	// Determine and define the most important runtime options given
	// either by cli options, or set as environment variables
	// Output relevant information along the way

	// Theater configuration
	// The THEATER option will make the CLI program build and run the orhestration theater instead of a stage

	const theater = cli.theater !== undefined ? cli.theater : env.THEATER === "true" || false;
	if (theater) {
		console.log("🏛️ ", Chalk.bgBlueBright("[CONFIG]"), "Theater", theater);
	}

	// If THEATER_PASSWORD is set or 'theaterPassword' is given in the CLI it will be used for theater authentication
	const theaterPassword = cli.theaterPassword !== undefined ? cli.theaterPassword : env.THEATER_PASSWORD || "admin";
	if (theater) {
		console.log("🏛️ ", Chalk.bgBlueBright("[CONFIG]"), "Theater Password", theaterPassword);
	}

	// Stage configuration
	console.log();

	// If SHOW_ID is set or 'showId' is given in the CLI it will be used to load a specific show configuration in stage mode
	const showId = cli.showId !== undefined ? cli.showId : env.SHOW_ID ? Number(env.SHOW_ID) : undefined;
	if (!theater && showId) {
		console.log("🏷️ ", Chalk.bgBlueBright("[CONFIG]"), "Show ID", showId);
	}

	// If SHOW_NAME is set or the 'name' option is given in the CLI the
	// deployment/stage will be named after the given string, otherwise it
	// will be unnamned
	const showName = cli.name !== undefined ? cli.name : env.SHOW_NAME || "";
	if (showId == undefined && !theater && showName) {
		console.log("🏷️ ", Chalk.bgBlueBright("[CONFIG]"), "Show Name", showName);
	}

	// If SHOW_PASSWORD is set it will default the deployed stage to be password protected with the string given
	// otherwise it will be set to an empty string and the stage will be public
	const showPassword = cli.password !== undefined ? cli.password : env.SHOW_PASSWORD || "";
	if (showId == undefined && !theater && showPassword) {
		console.log("🏷️ ", Chalk.bgBlueBright("[CONFIG]"), "Show Password", showPassword);
	}

	// Runtime options
	console.log();

	// The PRODUCTION option indicates to the source code that the stage server
	// is reachable by end-users, as opposite to being in development mode where
	// only authorized developers are accessing the server
	const production = cli.production !== undefined ? cli.production : env.NODE_ENV == "production" || (env.PRODUCTION && env.PRODUCTION != "false");
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Production Mode", production);

	// If VERBOSE is enabled more detailed console outputs will be given, for debugging purposes
	const verbose = cli.verbose !== undefined ? cli.verbose : env.VERBOSE === "true" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Verbose Output", verbose);

	// If DEBUG is enabled the nodeJS application will be launched with support for an external debugger
	const debug = cli.debug !== undefined ? cli.debug : env.DEBUG === "true" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Debug", debug);

	// The PORT option sets the network interface port for the server to bind to.
	// Defaults to 3000.
	const port = cli.port !== undefined ? cli.port : env.PORT ? Number(env.PORT) : 3000;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "HTTP Port", port);

	// The LOCAL options enables the stage server to be reached from the loopback interface of the machine running the server
	const local = cli.local !== undefined ? cli.local : env.LOCAL != "false";

	// The LAN options enables the stage server to be reached from within the current local area network
	const lan = cli.lan !== undefined ? cli.lan : env.LAN != "false";

	// The WAN options enables the stage server to be reached from the current wide area network, i.e.  the public internet
	const wan = cli.wan !== undefined ? cli.wan : env.WAN != "false";

	// The BUILD option makes the CLI program generate fresh server and frontend code bundles for the current configuration
	const build = cli.build !== undefined ? cli.build : env.BUILD != "false";
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Build", build);

	// The WATCH option makes the CLI program stay alive and watch and rebuild the source code files when changed
	const watch = cli.watch !== undefined ? cli.watch : env.WATCH != "false";
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Watch", watch);

	// The START option will make the CLI program launch the server with the current configuration
	const start = cli.start !== undefined ? cli.start : env.START != "false";
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Start", start);

	// The STAGE_NOT_USED option starts the stage server in not-used mode, preventing access to show views
	const notUsed = cli.notUsed !== undefined ? cli.notUsed : env.STAGE_NOT_USED === "true" || false;
	if (notUsed) {
		console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Not-Used Mode", notUsed);
	}

	// If SLUG is set or 'slug' is given in the CLI it will be used to identify this deployment (stage), otherwise a slug
	// from the SHOW_NAME will be used
	const slug = (cli.slug !== undefined ? cli.slug : env.SLUG) || (theater ? "theater" : `show-${showId}`);
	if (showId == undefined) {
		console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Runtime Slug", slug);
	}

	// IPC configuration
	console.log();

	// The URL for the remote stage server
	const ipcStageUrl = cli.ipcStageUrl !== undefined ? cli.ipcStageUrl : env.IPC_STAGE_URL || "http://localhost:3000";
	if (theater) {
		console.log("🔸", Chalk.bgBlueBright("[CONFIG]"), "IPC Stage URL", ipcStageUrl);
	}

	// Tthe secret key for inter-process communication
	const ipcSecret = cli.ipcSecret !== undefined ? cli.ipcSecret : env.IPC_SECRET || "channelle-ipc-secret";
	if (theater) {
		// Show for both theater and stage modes
		console.log(
			"🔌",
			Chalk.bgBlueBright("[CONFIG]"),
			"Theater Adapter IPC Secret",
			ipcSecret.startsWith("channelle-") ? ipcSecret : "***" + ipcSecret.slice(-4),
		);
	} else {
		// Show for both theater and stage modes
		console.log(
			"🔌",
			Chalk.bgBlueBright("[CONFIG]"),
			"Theater Connection IPC Secret",
			ipcSecret.startsWith("channelle-") ? ipcSecret : "***" + ipcSecret.slice(-4),
		);
	}

	// The URL for the theater server when deployed (used to generate correct sharable links)
	// Default to localhost in development, channelle.se in production
	const theaterServerUrl =
		cli.theaterServerUrl !== undefined ? cli.theaterServerUrl : env.THEATER_SERVER_URL || (production ? "https://channelle.se" : "http://localhost:3000");

	console.log("🎭", Chalk.bgBlueBright("[CONFIG]"), "Theater Server URL", theaterServerUrl);

	// Create an array of transport listening info for webRTC, will be filled
	// with configurations depending on the given wan, lan and local settings
	// lower array-placement indicates preference in media soup
	const webRTCTransportListenInfos = [];

	if (start) {
		if (wan) {
			// Get the public IP of this server - use WAN_IP env var if set, otherwise auto-detect
			let publicIP;
			if (process.env.WAN_IP || cli.wanIp) {
				publicIP = cli.wanIp || process.env.WAN_IP;
			} else {
				publicIP = await publicIpv4({ version: 4, timeout: 10000 }).catch((error) => {
					console.error("💥 Failed to get a public IP:", error);
					return undefined;
				});
			}

			// Add listening infos for WAN,
			webRTCTransportListenInfos.push({
				protocol: "udp",
				ip: "0.0.0.0",
				announcedAddress: publicIP,
			});
			webRTCTransportListenInfos.push({
				protocol: "tcp",
				ip: "0.0.0.0",
				announcedAddress: publicIP,
			});
			console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "WEBRTC WAN", publicIP);
		}
		if (lan) {
			// Get any lan IP addresses of this server
			const lanIP = Object.entries(networkInterfaces())
				.map(([i, networks]) => networks.filter((n) => n.family == "IPv4").map((n) => ({ ...n, interface: i })))
				.flat()
				.find((n) => !n.internal && n.netmask == "255.255.255.0")?.address;

			// Add listening info for WAN,
			webRTCTransportListenInfos.push({
				protocol: "udp",
				ip: lanIP,
				announcedAddress: lanIP,
			});
			webRTCTransportListenInfos.push({
				protocol: "tcp",
				ip: lanIP,
				announcedAddress: lanIP,
			});
			console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "WEBRTC LAN", lanIP);
		}
		if (local) {
			// Add listening info for LOCALHOST,
			webRTCTransportListenInfos.push({
				protocol: "udp",
				ip: "127.0.0.1",
				announcedAddress: "127.0.0.1",
			});
			webRTCTransportListenInfos.push({
				protocol: "tcp",
				ip: "127.0.0.1",
				announcedAddress: "127.0.0.1",
			});
			console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "WEBRTC LOCALHOST", "127.0.0.1");
		}
	}

	// Create the appropriate configuration

	/** @type {Types.CONFIG} */
	const config = {
		/** Runtime Options */
		runtime: {
			production: production,
			port: port,
			verbose: verbose,
			debug: debug,
			build: build,
			watch: watch,
			start: start,
			theater: theater,
			slug: slug,
			notUsed: notUsed,
		},
		/** Package Information */
		package: {
			name: pkg.name,
			version: pkg.version,
		},
		/** Build Settings */
		build: {
			/** The directory to use for server builds */
			serverOutput: theater ? ".dist/theater-server" : ".dist/stage-server",
			/** The directory to use for interface builds */
			interfaceOutput: theater ? ".dist/theater-interface" : ".dist/stage-interface",
			/** The default interface entry point file */
			defaultInterfaceEntryPoint: theater ? "theater.html" : "stage.html",
			/** The files to use as build inputs for the stage-interface, relative to the 'stage-interface' folder. */
			stageInterfaceInputs: ["stage.html", "backstage.html", "notfound.html", "_stage.ts", "_backstage.ts"],
			/** The files to use as build inputs for the theater-interface, relative to the 'theater-interface' folder. */
			theaterInterfaceInputs: ["theater.html", "_theater.ts", "preparation.html", "_preparation.ts"],
		},

		/** Theater Settings */
		theater: {
			password: theaterPassword,
		},
		/** Backstage Settings */
		backstage: {
			showId: showId,
			showDefaults: {
				name: showName,
				password: showPassword,
			},
		},
		/** Web Server Settings */
		web: {
			/** Announced ip addresses */
			announcedAddresses: webRTCTransportListenInfos.map((info) => info.announcedAddress),
			/** Exposed listening host */
			host: production ? "0.0.0.0" : "localhost",
			/** Exposed listening port */
			port: port,
		},

		/** IPC Configuration for theater-stage communication */
		ipc: {
			/** URL for stage server communication */
			stageUrl: ipcStageUrl,
			/** Secret key for inter-process communication between theater and stage servers */
			secret: ipcSecret,
			/** URL for the theater server when deployed (used to generate correct sharable links) */
			theaterServerUrl: theaterServerUrl,
		},
		/** MediaSoup Settings */
		mediasoup: {
			/** Worker Settings */
			worker: {
				rtcMinPort: 40000,
				rtcMaxPort: 49999,
				logLevel: production ? "warn" : "debug",
				logTags: [
					"info",
					"ice",
					"dtls",
					"rtp",
					"srtp",
					"rtcp",
					// 'rtx',
					// 'bwe',
					// 'score',
					// 'simulcast', NOTE: What is simulcast? It was in the media soup demo and conntected to screen sharing - does it need to be re-added?
					// 'svc'
				],
			},
			/** Router settings */
			router: {
				mediaCodecs: [
					{
						kind: "audio",
						mimeType: "audio/opus",
						clockRate: 48000,
						channels: 2,
					},
					{
						kind: "video",
						mimeType: "video/VP8",
						clockRate: 90000,
						parameters: {
							// 'x-google-start-bitrate': 1000
						},
					},
					{
						kind: "video",
						mimeType: "video/h264",
						clockRate: 90000,
						parameters: {
							"packetization-mode": 1,
							"profile-level-id": "4d0032",
							"level-asymmetry-allowed": 1,
							// 'x-google-start-bitrate': 1000
						},
					},
					{
						kind: "video",
						mimeType: "video/h264",
						clockRate: 90000,
						parameters: {
							"packetization-mode": 1,
							"profile-level-id": "42e01f",
							"level-asymmetry-allowed": 1,
							// 'x-google-start-bitrate': 1000
						},
					},
				],
			},
			/** WebRTC Transport settings **/
			webRTCTransport: {
				listenInfos: webRTCTransportListenInfos,
				initialAvailableOutgoingBitrate: 800000,
			},
		},
	};

	// Return it
	return config;
}
