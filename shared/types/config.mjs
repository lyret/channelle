/**
 * @typedef {Object} RuntimeConfig
 * @property {boolean} production - Indicates if the runtime is in production mode.
 * @property {number} port - The port number.
 * @property {boolean} verbose - Indicates if verbose logging is enabled.
 * @property {boolean} debug - Indicates if debug mode is enabled.
 * @property {boolean} build - Indicates if build mode is enabled.
 * @property {boolean} watch - Indicates if watch mode is enabled.
 * @property {boolean} start - Indicates if start mode is enabled.
 */

/**
 * @typedef {Object} PackageConfig
 * @property {string} name - The name of the package.
 * @property {string} version - The version of the package.
 */

/**
 * @typedef {Object} BuildConfig
 * @property {string} serverOutput - The directory to use for server builds.
 * @property {string} clientOutput - The directory to use for client builds.
 */

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} verboseOutput - Indicates that we want to show verbose warnings and log messages.
 */

/**
 * @typedef {Object} StageConfig
 * @property {string} name - The name of the stage.
 * @property {string} inviteKey - The invite key for the stage.
 */

/**
 * @typedef {Object} WebConfig
 * @property {string[]} announcedAddresses - Announced IP addresses.
 * @property {string} host - The exposed listening host.
 * @property {number} port - The exposed listening port.
 */

/**
 * @typedef {Object} Socket
 * @property {string} path - The path for the socket.
 * @property {string[]} transports - The transports for the socket.
 */

/**
 * @typedef {Object} WorkerConfig
 * @property {number} rtcMinPort - The minimum RTC port.
 * @property {number} rtcMaxPort - The maximum RTC port.
 * @property {string} logLevel - The log level.
 * @property {string[]} logTags - The log tags.
 */

/**
 * @typedef {Object} RouterConfig
 * @property {Object[]} mediaCodecs - The media codecs.
 */

/**
 * @typedef {Object} WebRTCTransportConfig
 * @property {Object[]} listenInfos - The listening infos.
 * @property {number} maxIncomingBitrate - The maximum incoming bitrate.
 * @property {number} initialAvailableOutgoingBitrate - The initial available outgoing bitrate.
 */

/**
 * @typedef {Object} MediasoupConfig
 * @property {WorkerConfig} worker - The worker settings.
 * @property {RouterConfig} router - The router settings.
 * @property {WebRTCTransportConfig} webRTCTransport - The WebRTC transport settings.
 */

/**
 * @typedef {Object} CONFIG - The global runtime context for the application
 * @property {RuntimeConfig} runtime - Runtime Options.
 * @property {PackageConfig} package - Package Information.
 * @property {boolean} isProduction - Indicates that we are in the production environment.
 * @property {BuildConfig} build - Build Settings.
 * @property {DebugConfig} debug - Debug Settings.
 * @property {StageConfig} stage - Stage Settings.
 * @property {WebConfig} web - Web Server Settings.
 * @property {Socket} socket - Socket IO Settings.
 * @property {MediasoupConfig} mediasoup - MediaSoup Settings.
 */

/** @type CONFIG */
export const CONFIG = /** @type CONFIG */ {};