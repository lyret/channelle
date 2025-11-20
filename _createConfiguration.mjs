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
			build: Boolean,
			watch: Boolean,
			start: Boolean,
			theater: Boolean,
			theaterAdapter: String,
			theaterAdapterLocalMaxStages: Number,
			theaterAdapterDigitaloceanApiKey: String,
			theaterAdapterDigitaloceanRegion: String,
			theaterAdapterDigitaloceanMaxVpns: Number,
		},
		{
			p: ["--port"],
			v: ["--verbose"],
			b: ["--build"],
			d: ["--debug"],
			w: ["--watch"],
			t: ["--theater"],
			s: ["--showId"],
			"theater-adapter": ["--theaterAdapter"],
			"theater-adapter-local-max-stages": ["--theaterAdapterLocalMaxStages"],
			"theater-adapter-digitalocean-api-key": ["--theaterAdapterDigitaloceanApiKey"],
			"theater-adapter-digitalocean-region": ["--theaterAdapterDigitaloceanRegion"],
			"theater-adapter-digitalocean-max-vpns": ["--theaterAdapterDigitaloceanMaxVpns"],
		},
	);

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
	const verbose = cli.verbose !== undefined ? cli.production : env.VERBOSE && env.VERBOSE != "false";
	console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Verbose Output", verbose);

	// If DEBUG is enabled the nodeJS application will be launched with support for an external debugger
	const debug = cli.debug !== undefined ? cli.debug : env.DEBUG != "false" || false;
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

	// If SLUG is set or 'slug' is given in the CLI it will be used to identify this deployment (stage), otherwise a slug
	// from the SHOW_NAME will be used
	const slug = cli.slug !== undefined ? cli.slug : env.SLUG || Slug(showName);
	if (showId == undefined) {
		console.log("🔹", Chalk.bgBlueBright("[CONFIG]"), "Runtime Slug", slug);
	}

	// Launcher configuration
	console.log();

	// The THEATER_ADAPTER option sets which adapter is active for launching stages
	const theaterAdapter = cli.theaterAdapter !== undefined ? cli.theaterAdapter : env.THEATER_ADAPTER || "none";
	if (theater) {
		console.log("🔸", Chalk.bgBlueBright("[CONFIG]"), "Theater Adapter", theaterAdapter.toUpperCase());
	}

	// The THEATER_ADAPTER_LOCAL_MAX_STAGES option sets the maximum number of local stage instances that can be launched simultaneously
	const maxLocalStages =
		cli.theaterAdapterLocalMaxStages !== undefined
			? cli.theaterAdapterLocalMaxStages
			: env.THEATER_ADAPTER_LOCAL_MAX_STAGES
				? Number(env.THEATER_ADAPTER_LOCAL_MAX_STAGES)
				: 1;
	if (theater && theaterAdapter === "local") {
		console.log("🔸", Chalk.bgBlueBright("[CONFIG]"), "Theater Adapter Local Max Stages", maxLocalStages);
	}

	// The THEATER_ADAPTER_DIGITALOCEAN_API_KEY option sets the API key for DigitalOcean launcher adapter
	const digitaloceanApiKey =
		cli.theaterAdapterDigitaloceanApiKey !== undefined ? cli.theaterAdapterDigitaloceanApiKey : env.THEATER_ADAPTER_DIGITALOCEAN_API_KEY || "";
	if (theater && theaterAdapter === "digitalocean" && digitaloceanApiKey) {
		console.log("🔸", Chalk.bgBlueBright("[CONFIG]"), "Theater Adapter DigitalOcean API Key", "***" + digitaloceanApiKey.slice(-4));
	}

	// The THEATER_ADAPTER_DIGITALOCEAN_MAX_VPNS option sets the maximum number of DigitalOcean VPN servers that can be launched
	const maxDigitaloceanVpns =
		cli.theaterAdapterDigitaloceanMaxVpns !== undefined
			? cli.theaterAdapterDigitaloceanMaxVpns
			: env.THEATER_ADAPTER_DIGITALOCEAN_MAX_VPNS
				? Number(env.THEATER_ADAPTER_DIGITALOCEAN_MAX_VPNS)
				: 5;
	if (theater && theaterAdapter === "digitalocean") {
		console.log("🔸", Chalk.bgBlueBright("[CONFIG]"), "Theater Adapter DigitalOcean Max VPNs", maxDigitaloceanVpns);
	}

	// The THEATER_ADAPTER_DIGITALOCEAN_REGION option sets the DigitalOcean region for droplet deployment
	const digitaloceanRegion =
		cli.theaterAdapterDigitaloceanRegion !== undefined ? cli.theaterAdapterDigitaloceanRegion : env.THEATER_ADAPTER_DIGITALOCEAN_REGION || "ams3";
	if (theater && theaterAdapter === "digitalocean") {
		console.log("🔸", Chalk.bgBlueBright("[CONFIG]"), "Theater Adapter DigitalOcean Region", digitaloceanRegion);
	}

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
			slug: slug,
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
			defaultInterfaceEntryPoint: theater ? "theater.html" : "home.html",
			/** The files to use as build inputs for the stage-interface, relative to the 'stage-interface' folder. */
			stageInterfaceInputs: ["home.html", "debug.html", "stage.html", "backstage.html", "_home.ts", "_debug.ts", "_stage.ts", "_backstage.ts"],
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
		/** Launcher Settings */
		launcher: {
			/** Active adapter name (none, local, digitalocean) */
			activeAdapter: theaterAdapter,
			/** Local adapter settings */
			local: {
				/** Maximum number of active local stage instances */
				maxActiveStages: maxLocalStages,
			},
			/** DigitalOcean adapter settings */
			digitalocean: {
				/** DigitalOcean API key */
				apiKey: digitaloceanApiKey,
				/** DigitalOcean region for droplet deployment */
				region: digitaloceanRegion,
				/** Maximum number of VPN servers */
				maxVpnServers: maxDigitaloceanVpns,
			},
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
