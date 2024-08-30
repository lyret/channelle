import 'dotenv/config';
import Chalk from 'chalk';
import Nopt from 'nopt';
import { publicIpv4 } from 'public-ip';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

// Parse environmental variables
const { env } = process;

// Parse Package JSON
const pkg = JSON.parse(readFileSync('./package.json'));

// Parse CLI Options
// @see https://www.npmjs.com/package/nopt
const cli = Nopt(
	{
		production: Boolean,
		domain: String,
		port: Number,
		verbose: Boolean,
		debug: Boolean,
		build: Boolean,
		watch: Boolean,
		start: Boolean,
	},
	{
		p: ['--port'],
		v: ['--verbose'],
		b: ['--build'],
		b: ['--debug'],
		w: ['--watch'],
		dev: [
			'--build',
			'--watch',
			'--start',
			'--no-production',
			'--debug',
			'--port',
			'3000',
			'--domain',
			'localhost',
		],
	}
);

/** Creates and returns a runtime context including any given CLI options */
export async function createConfiguration() {
	// Get any lan IP addresses of this server
	const lanIP = Object.entries(networkInterfaces())
		.map(([i, networks]) =>
			networks
				.filter((n) => n.family == 'IPv4')
				.map((n) => ({ ...n, interface: i }))
		)
		.flat()
		.find((n) => !n.internal)?.address;

	// Get the public IP of this server
	const publicIP = await publicIpv4();

	// Determine and define the most important runtime options given
	// either by cli options, or set as environment variables
	const production =
		cli.production !== undefined
			? cli.production
			: env.NODE_ENV == 'production' ||
				(env.PRODUCTION && env.PRODUCTION != 'false');

	const domain =
		cli.domain !== undefined ? cli.domain : env.DOMAIN || 'localhost';

	const port =
		cli.port !== undefined ? cli.port : env.PORT ? Number(env.PORT) : 3000;

	const verbose =
		cli.verbose !== undefined
			? cli.production
			: env.VERBOSE && env.VERBOSE != 'false';

	const debug =
		cli.debug !== undefined ? cli.debug : env.DEBUG != 'false' || false;

	const build =
		cli.build !== undefined ? cli.build : env.BUILD != 'false' || false;

	const watch =
		cli.watch !== undefined ? cli.watch : env.WATCH != 'false' || false;

	const start =
		cli.start !== undefined ? cli.start : env.START != 'false' || false;

	const announcedIp = production ? publicIP : lanIP || '127.0.0.1';

	console.log();
	console.log(
		'🔹',
		Chalk.bgBlueBright('[CONFIG]'),
		'Production Mode',
		production
	);
	console.log('🔹', Chalk.bgBlueBright('[CONFIG]'), 'Port', Chalk.bold(port));
	console.log(
		'🔹',
		Chalk.bgBlueBright('[CONFIG]'),
		'Domain',
		Chalk.italic(domain)
	);
	console.log(
		'🔹',
		Chalk.bgBlueBright('[CONFIG]'),
		'Announced IP',
		Chalk.bold(announcedIp)
	);
	console.log('🔹', Chalk.bgBlueBright('[CONFIG]'), 'Verbose Output', verbose);
	console.log('🔹', Chalk.bgBlueBright('[CONFIG]'), 'Debug', debug);
	console.log('🔹', Chalk.bgBlueBright('[CONFIG]'), 'Build', build);
	console.log('🔹', Chalk.bgBlueBright('[CONFIG]'), 'Watch', watch);
	console.log('🔹', Chalk.bgBlueBright('[CONFIG]'), 'Start', start);
	console.log();

	// Create the appropriate configuration
	const config = {
		/** Runtime Options */
		runtime: {
			production: production,
			domain: domain,
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
			serverOutput: '.dist/server',
			/** The directory to use for client builds */
			clientOutput: '.dist/ui',
		},
		/** Debug Settings */
		debug: {
			/** Indicates that we want to show verbose warnings and log messages */
			verboseOutput: verbose,
		},
		// sslCrt: "/etc/ssl/certs/ssl-cert-snakeoil.pem",
		// sslKey: "/etc/ssl/private/ssl-cert-snakeoil.key",
		/** Web Server Settings */
		web: {
			/** Exposed listening host */
			host: production ? '0.0.0.0' : 'localhost',
			/** Exposed listening port */
			port: port,
		},
		/** Socket IO Settings */
		socket: {
			url: production ? domain : `localhost:${port}`,
			path: '/server',
			transports: ['websocket'],
		},
		/** MediaSoup Settings */
		mediasoup: {
			/** Worker Settings */
			worker: {
				rtcMinPort: 10000,
				rtcMaxPort: 10100,
				logLevel: 'warn',
				logTags: [
					'info',
					'ice',
					'dtls',
					'rtp',
					'srtp',
					'rtcp',
					// 'rtx',
					// 'bwe',
					// 'score',
					// 'simulcast',
					// 'svc'
				],
			},
			/** Router settings */
			router: {
				mediaCodecs: [
					{
						kind: 'audio',
						mimeType: 'audio/opus',
						clockRate: 48000,
						channels: 2,
					},
					{
						kind: 'video',
						mimeType: 'video/VP8',
						clockRate: 90000,
						parameters: {
							'x-google-start-bitrate': 1000,
						},
					},
				],
			},
			/** WebRTC Transport settings **/
			webRTCTransport: {
				listenIps: [
					production
						? {
								ip: '0.0.0.0',
								announcedIp: announcedIp,
							}
						: {
								ip: announcedIp,
							},
				],
				maxIncomingBitrate: 1500000,
				initialAvailableOutgoingBitrate: 1000000,
			},
		},
	};

	// Return it
	return config;
}
