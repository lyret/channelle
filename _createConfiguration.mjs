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
 * @returns {CONFIG} CONFIG - The runtime context
 */
export async function createConfiguration() {
	// Parse environmental variables
	const { env } = process;

	// Parse Package JSON
	const pkg = JSON.parse(readFileSync("./package.json"));

	// Parse CLI Options
	// @see https://www.npmjs.com/package/nopt
	const cli = Nopt(
		{
			name: String,
			inviteKey: String,
			id: String,
			production: Boolean,
			port: Number,
			verbose: Boolean,
			debug: Boolean,
			local: Boolean,
			lan: Boolean,
			wan: Boolean,
			build: Boolean,
			watch: Boolean,
			start: Boolean,
			theater: Boolean,
		},
		{
			p: ["--port"],
			v: ["--verbose"],
			b: ["--build"],
			d: ["--debug"],
			w: ["--watch"],
			t: ["--theater"],
		},
	);

	// Determine and define the most important runtime options given
	// either by cli options, or set as environment variables
	// Output relevant information along the way

	// Stage configuration
	console.log();

	// If STAGE_NAME is set or the 'name' option is given in the CLI the
	// deployment/stage will be named after the given string, otherwise it
	// will be unnamned
	const stageName = cli.name !== undefined ? cli.name : env.STAGE_NAME || "";
	console.log("🏷️ ", Chalk.bgBlueBright("[CONFIG]"), "Stage Name", stageName);

	// If STAGE_INVITE_LINK_KEY is set it will default the deployed stage to be password protected with the string given
	// otherwise it will be set to an empty string and the stage will be public
	const stageInviteLinkKey = cli.name !== undefined ? cli.inviteKey : env.STAGE_INVITE_LINK_KEY || "";
	if (stageInviteLinkKey) {
		console.log("🏷️ ", Chalk.bgBlueBright("[CONFIG]"), "Invite Link Key", stageInviteLinkKey);
	}

	// If STAGE_ID is set or 'id' is given in the CLI it will be used to identify this deployment (stage), otherwise a slug
	// from the STAGE_NAME will be used
	const stageId = cli.id !== undefined ? cli.id : env.STAGE_ID || Slug(stageName);
	console.log("🏷️ ", Chalk.bgBlueBright("[CONFIG]"), "Identifier", stageId);

	// Runtime options
	console.log();

	// The PRODUCTION option indicates to the source code that the stage server
	// is reachable by end-users, as opposite to being in development mode where
	// only authorized developers are accessing the server
	const production = cli.production !== undefined ? cli.production : env.NODE_ENV == "production" || (env.PRODUCTION && env.PRODUCTION != "false");
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Production Mode", production);

	// If VERBOSE is enabled more detailed console outputs will be given, for debugging purposes
	const verbose = cli.verbose !== undefined ? cli.production : env.VERBOSE && env.VERBOSE != "false";
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Verbose Output", verbose);

	// If DEBUG is enabled the nodeJS application will be launched with support for an external debugger
	const debug = cli.debug !== undefined ? cli.debug : env.DEBUG != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Debug", debug);

	// The PORT option sets the network interface port for the server to bind to.
	// Defaults to 3000.
	const port = cli.port !== undefined ? cli.port : env.PORT ? Number(env.PORT) : 3000;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "HTTP Port", Chalk.bold(port), `WS Port: ${port + 1}`);

	// The LOCAL options enables the stage server to be reached from the loopback interface of the machine running the server
	const local = cli.local !== undefined ? cli.local : env.LOCAL != "false" || true;

	// The LAN options enables the stage server to be reached from within the current local area network
	const lan = cli.lan !== undefined ? cli.lan : env.LAN != "false" || true;

	// The WAN options enables the stage server to be reached from the current wide area network, i.e.  the public internet
	const wan = cli.wan !== undefined ? cli.wan : env.WAN != "false" || production;

	// The BUILD option makes the CLI program generate fresh server and frontend code bundles for the current configuration
	const build = cli.build !== undefined ? cli.build : env.BUILD != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Build", build);

	// The WATCH option makes the CLI program stay alive and watch and rebuild the source code files when changed
	const watch = cli.watch !== undefined ? cli.watch : env.WATCH != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Watch", watch);

	// The START option will make the CLI program launch the server with the current configuration
	const start = cli.start !== undefined ? cli.start : env.START != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Start", start);

	// The THEATER option will make the CLI program build and run the theater component instead of server/client
	const theater = cli.theater !== undefined ? cli.theater : env.THEATER === "true" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Theater", theater);
	console.log();

	// Create an array of transport listening info for webRTC, will be filled
	// with configurations depending on the given wan, lan and local settings
	// lower array-placement indicates preference in media soup
	const webRTCTransportListenInfos = [];

	if (start) {
		if (wan) {
			// Get the public IP of this server
			const publicIP = await publicIpv4({ version: 4, timeout: 10000 }).catch((error) => {
				console.error("💥 Failed to get a public IP:", error);
				return undefined;
			});

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
				.find((n) => !n.internal)?.address;

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

	// Determine the listening info for media soup

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
		},
		/** Package Information */
		package: {
			name: pkg.name,
			version: pkg.version,
		},
		/** Indicates that we are in the production environment */
		isProduction: production,
		/** Build Settings */
		build: {
			/** The directory to use for stage-server builds */
			stageServerOutput: ".dist/stage-server",
			/** The directory to use for stage-interface builds */
			stageInterfaceOutput: ".dist/stage-interface",
			/** The directory to use for theater-server builds */
			theaterServerOutput: ".dist/theater-server",
			/** The directory to use for theater-interface builds */
			theaterInterfaceOutput: ".dist/theater-interface",
			/** The files to use as build inputs for the stage-interface, relative to the 'stage-interface' folder. */
			stageInterfaceInputs: ["home.html", "debug.html", "stage.html", "backstage.html", "_home.ts", "_debug.ts", "_stage.ts", "_backstage.ts"],
			/** The files to use as build inputs for the theater-interface, relative to the 'theater-interface' folder. */
			theaterInterfaceInputs: ["theater.html", "_theater.ts"],
		},
		/** Debug Settings */
		debug: {
			/** Indicates that we want to show verbose warnings and log messages */
			verboseOutput: verbose,
		},
		/** Stage Settings */
		stage: {
			name: stageName,
			inviteKey: stageInviteLinkKey,
			id: stageId,
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
		/** Websockets Settings */
		socket: {
			port: port + 1,
			path: "/ws", // TODO: no longer used?
			transports: ["websocket"],
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
