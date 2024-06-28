// TODO: Default Lyret setup, currently unused

/** Generates a appropriate configuration object depending on the given runtime environment and environment variables */
export default (isProduction, showWarnings) => ({
  /** Indicates that we are in the production environment */
  isProduction: isProduction,
  /** Debug Settings */
  debug: {
    /** Indicates that we want to show verbose warnings and log messages */
    verboseOutput: showWarnings,
  },
  // sslCrt: "/etc/ssl/certs/ssl-cert-snakeoil.pem",
  // sslKey: "/etc/ssl/private/ssl-cert-snakeoil.key",
  /** Web Server Settings */
  web: {
    /** Exposed listening host */
    host: isProduction ? '0.0.0.0' : 'localhost',
    /** Exposed listening port */
    port: process.env.PORT || 3000,
  },
  /** Socket IO Settings */
  socket: {
    url: isProduction ? 'https://iia.freaks.se' : 'localhost:3000',
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
});
