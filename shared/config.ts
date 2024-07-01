// TODO: Was created at build time with ES build previously

/** Indicates that this is a run while the solution is still in development */
const IS_DEVELOPMENT = process.env.NODE_ENV != 'production';
const IS_PRODUCTION = !IS_DEVELOPMENT;
const SHOW_WARNINGS = false;

export const Config = {
  /** Indicates that we are in the production environment */
  isProduction: IS_PRODUCTION,
  /** Debug Settings */
  debug: {
    /** Indicates that we want to show verbose warnings and log messages */
    verboseOutput: SHOW_WARNINGS,
  },
  // sslCrt: "/etc/ssl/certs/ssl-cert-snakeoil.pem",
  // sslKey: "/etc/ssl/private/ssl-cert-snakeoil.key",
  /** Web Server Settings */
  web: {
    /** Exposed listening host */
    host: IS_PRODUCTION ? '0.0.0.0' : 'localhost',
    /** Exposed listening port */
    port: process.env.PORT || 3000,
  },
  /** Socket IO Settings */
  socket: {
    url: IS_PRODUCTION ? 'https://iia.freaks.se' : 'localhost:3000',
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
        IS_PRODUCTION
          ? {
              ip: '0.0.0.0',
              announcedIp: '81.237.215.202',
            }
          : {
              ip: '127.0.0.1',
            },
      ],
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000,
    },
  },
};
