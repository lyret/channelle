import Chalk from "chalk";
import "dotenv/config";
import { readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import Nopt from "nopt";
import { publicIpv4 } from "public-ip";

/** Creates and returns a runtime context including any given CLI options */
export async function createConfiguration() {
	// Parse environmental variables
	const { env } = process;

	// Parse Package JSON
	const pkg = JSON.parse(readFileSync("./package.json"));

	// Parse CLI Options
	// @see https://www.npmjs.com/package/nopt
	const cli = Nopt(
		{
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
		},
		{
			p: ["--port"],
			v: ["--verbose"],
			b: ["--build"],
			d: ["--debug"],
			w: ["--watch"],
		}
	);

	// Determine and define the most important runtime options given
	// either by cli options, or set as environment variables
	// Output relevant information along the way
	console.log();

	// The PRODUCTION option indicates to the source code that the stage server
	// is reachable by end-users, as opposite to being in development mode where
	// only authorized developers are accessing the server
	const production =
		cli.production !== undefined
			? cli.production
			: env.NODE_ENV == "production" ||
				(env.PRODUCTION && env.PRODUCTION != "false");
	console.log(
		"🔹",
		Chalk.bgBlueBright("[CONFIG]"),
		"Production Mode",
		production
	);

	// If VERBOSE is enabled more detailed console outputs will be given, for debugging purposes
	const verbose =
		cli.verbose !== undefined
			? cli.production
			: env.VERBOSE && env.VERBOSE != "false";
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Verbose Output", verbose);

	// If DEBUG is enabled the nodeJS application will be launched with support for an external debugger
	const debug =
		cli.debug !== undefined ? cli.debug : env.DEBUG != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Debug", debug);

	// The PORT option sets the network interface port for the server to bind to.
	// Defaults to 3000.
	const port =
		cli.port !== undefined ? cli.port : env.PORT ? Number(env.PORT) : 3000;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Port", Chalk.bold(port));

	// The LOCAL options enables the stage server to be reached from the loopback interface of the machine running the server
	const local =
		cli.local !== undefined ? cli.LOCAL : env.local != "false" || true;

	// The LAN options enables the stage server to be reached from within the current local area network
	const lan = cli.lan !== undefined ? cli.LAN : env.lan != "false" || true;

	// The WAN options enables the stage server to be reached from the current wide area network, i.e.  the public internet
	const wan =
		cli.wan !== undefined ? cli.wan : env.WAN != "false" || production;

	// The BUILD option makes the CLI program generate fresh server and frontend code bundles for the current configuration
	const build =
		cli.build !== undefined ? cli.build : env.BUILD != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Build", build);

	// The WATCH option makes the CLI program stay alive and watch and rebuild the source code files when changed
	const watch =
		cli.watch !== undefined ? cli.watch : env.WATCH != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Watch", watch);

	// The START option will make the CLI program launch the server with the current configuration
	const start =
		cli.start !== undefined ? cli.start : env.START != "false" || false;
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Start", start);
	console.log();

	// Create an array of transport listening info for webRTC, will be filled
	// with configurations depending on the given wan, lan and local settings
	// lower array-placement indicates preference in media soup
	const webRTCTransportListenInfos = [];
	if (start) {
		if (wan) {
			// Get the public IP of this server NOTE: hangs forever when not connected to internet
			const publicIP = await publicIpv4();

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
				.map(([i, networks]) =>
					networks
						.filter((n) => n.family == "IPv4")
						.map((n) => ({ ...n, interface: i }))
				)
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
			console.log(
				"🔹",
				Chalk.bgBlueBright("[CONFIG]"),
				"WEBRTC LOCALHOST",
				"127.0.0.1"
			);
		}
	}

	// Determine the listening info for media soup

	// Create the appropriate configuration
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
			/** The directory to use for server builds */
			serverOutput: ".dist/server",
			/** The directory to use for client builds */
			clientOutput: ".dist/ui",
		},
		/** Debug Settings */
		debug: {
			/** Indicates that we want to show verbose warnings and log messages */
			verboseOutput: verbose,
		},
		/** Stage Settings */
		stage: {
			name: process.env.STAGE_NAME || "",
			inviteKey: process.env.STAGE_INVITE_LINK_KEY || "123",
		},
		/** Web Server Settings */
		web: {
			/** Announced ip addresses */
			announcedAddresses: webRTCTransportListenInfos.map(
				(info) => info.announcedAddress
			),
			/** Exposed listening host */
			host: production ? "0.0.0.0" : "localhost",
			/** Exposed listening port */
			port: port,
		},
		/** Socket IO Settings */
		socket: {
			path: "/ws",
			transports: ["websocket"],
		},
		/** MediaSoup Settings */
		mediasoup: {
			/** Worker Settings */
			worker: {
				rtcMinPort: 10000,
				rtcMaxPort: 10100,
				logLevel: "warn",
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
							"x-google-start-bitrate": 1000,
						},
					},
				],
			},
			/** WebRTC Transport settings **/
			webRTCTransport: {
				listenInfos: webRTCTransportListenInfos,
				maxIncomingBitrate: 1500000,
				initialAvailableOutgoingBitrate: 1000000,
			},
		},
	};

	// Return it
	return config;
}
