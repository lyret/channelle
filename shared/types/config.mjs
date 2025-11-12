/**
 * @typedef {Object} RuntimeConfig
 * @property {boolean} production - Indicates if the runtime is in production mode.
 * @property {number} port - The port number.
 * @property {boolean} verbose - Indicates if verbose logging is enabled.
 * @property {boolean} debug - Indicates if debug mode is enabled.
 * @property {boolean} build - Indicates if build mode is enabled.
 * @property {boolean} watch - Indicates if watch mode is enabled.
 * @property {boolean} start - Indicates if start mode is enabled.
 * @property {boolean} theater - Indicates if theater mode is enabled.
 */

/**
 * @typedef {Object} PackageConfig
 * @property {string} name - The name of the package.
 * @property {string} version - The version of the package.
 */

/**
 * @typedef {Object} BuildConfig
 * @property {string} serverOutput - The directory to use for server builds.
 * @property {string} interfaceOutput - The directory to use for interface builds.
 * @property {string} defaultInterfaceEntryPoint - The default interface entry point file (either "home.html" or "theater.html").
 * @property {Array<string>} stageInterfaceInputs - The files to use as build inputs for the stage-interface, relative to the 'stage-interface' folder.
 * @property {Array<string>} theaterInterfaceInputs - The files to use as build inputs for the theater-interface, relative to the 'theater-interface' folder.
 */

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} verboseOutput - Indicates that we want to show verbose warnings and log messages.
 */

/**
 * @typedef {Object} TheaterConfig
 * @property {string} password - The password for administrator authentication.
 */

/**
 * @typedef {Object} StageConfig
 * @property {string} name - The name of the stage.
 * @property {string} inviteKey - The invite key for the stage.
 * @property {string} id - The identifier for the stage.
 * @property {number|undefined} showId - The show ID to initialize the stage with (optional).
 */

/**
 * @typedef {Object} WebConfig
 * @property {string[]} announcedAddresses - Announced IP addresses.
 * @property {string} host - The exposed listening host.
 * @property {number} port - The exposed listening port.
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
 * @typedef {Object} LauncherConfig
 * @property {string} activeAdapter - Active adapter name (none, local, digitalocean).
 * @property {Object} local - Local adapter settings.
 * @property {number} local.maxActiveStages - Maximum number of active local stage instances.
 * @property {Object} digitalocean - DigitalOcean adapter settings.
 * @property {string} digitalocean.apiKey - DigitalOcean API key.
 * @property {string} digitalocean.region - DigitalOcean region for droplet deployment.
 * @property {number} digitalocean.maxVpnServers - Maximum number of VPN servers.
 */

/**
 * @typedef {Object} CONFIG - The global runtime context for the application
 * @property {RuntimeConfig} runtime - Runtime Options.
 * @property {PackageConfig} package - Package Information.
 * @property {BuildConfig} build - Build Settings.
 * @property {DebugConfig} debug - Debug Settings.
 * @property {TheaterConfig} theater - Theater Settings.
 * @property {StageConfig} stage - Stage Settings.
 * @property {WebConfig} web - Web Server Settings.
 * @property {LauncherConfig} launcher - Launcher Settings.
 * @property {MediasoupConfig} mediasoup - MediaSoup Settings.
 */

/** @type CONFIG */
export const CONFIG = /** @type CONFIG */ {};
