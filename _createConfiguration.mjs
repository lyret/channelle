import 'dotenv/config';
import { publicIpv4 } from 'public-ip';
import { networkInterfaces } from 'node:os';

// Parse environmental variables
const { env } = process;

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

	// Define the most important environmental variables
	const isProduction = !!(
		env.NODE_ENV == 'production' || env.PRODUCTION == 'true'
	);
	const isVerbose = !!(env.VERBOSE == 'true');
	const domain = isProduction ? env.DOMAIN : 'localhost';
	const port = Number(env.PORT) || 3000;
	const announcedIp = isProduction ? publicIP : lanIP || '127.0.0.1';

	console.log('[BUILD]', 'Domain', domain);
	console.log('[BUILD]', 'Announced IP', announcedIp);
	console.log('[BUILD]', 'Is Production', isProduction);
	console.log('[BUILD]', 'Port', port);
	console.log('[BUILD]', 'Verbose Output', isVerbose);
	console.log();
	console.log('[BUILD]', 'Build', env.BUILD == 'true');
	console.log('[BUILD]', 'Watch', env.WATCH == 'true');
	console.log('[BUILD]', 'Start', env.START == 'true');

	// Create the appropriate configuration
	const config = {
		/** Indicates that we are in the production environment */
		isProduction: isProduction,
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
			verboseOutput: isVerbose,
		},
		// sslCrt: "/etc/ssl/certs/ssl-cert-snakeoil.pem",
		// sslKey: "/etc/ssl/private/ssl-cert-snakeoil.key",
		/** Web Server Settings */
		web: {
			/** Exposed listening host */
			host: isProduction ? '0.0.0.0' : 'localhost',
			/** Exposed listening port */
			port: port,
		},
		/** Socket IO Settings */
		socket: {
			url: isProduction ? domain : `localhost:${port}`,
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
					isProduction
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
