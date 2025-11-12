type RuntimeConfig = {
	/** Indicates if the runtime is in production mode. */
	production: boolean;
	/** The port number. */
	port: number;
	/** Indicates if verbose logging is enabled. */
	verbose: boolean;
	/** Indicates if debug mode is enabled. */
	debug: boolean;
	/** Indicates if build mode is enabled. */
	build: boolean;
	/** Indicates if watch mode is enabled. */
	watch: boolean;
	/** Indicates if start mode is enabled. */
	start: boolean;
	/** Indicates if theater mode is enabled. */
	theater: boolean;
};

type PackageConfig = {
	/** The name of the package. */
	name: string;
	/** The version of the package. */
	version: string;
};

type BuildConfig = {
	/** The directory to use for server builds. */
	serverOutput: string;
	/** The directory to use for interface builds. */
	interfaceOutput: string;
	/** The default interface entry point file (either "home.html" or "theater.html"). */
	defaultInterfaceEntryPoint: string;
	/** The files to use as build inputs for the stage-interface, relative to the 'stage-interface' folder. */
	stageInterfaceInputs: Array<string>;
	/** The files to use as build inputs for the theater-interface, relative to the 'theater-interface' folder. */
	theaterInterfaceInputs: Array<string>;
};

type DebugConfig = {
	/** Indicates that we want to show verbose warnings and log messages. */
	verboseOutput: boolean;
};

type StageConfig = {
	/** The password for administrator authentication. */
	password: string;
};

type StageConfig = {
	/** The name of the stage. */
	name: string;
	/** The invite key for the stage. */
	inviteKey: string;
	/** The identifier for the stage. */
	id: string;
	/** The show ID to initialize the stage with (optional). */
	showId?: number;
};

type WebConfig = {
	/** Announced IP addresses. */
	announcedAddresses: string[];
	/** The exposed listening host. */
	host: string;
	/** The exposed listening port. */
	port: number;
};

type WorkerConfig = {
	/** The minimum RTC port. */
	rtcMinPort: number;
	/** The maximum RTC port. */
	rtcMaxPort: number;
	/** The log level. */
	logLevel: string;
	/** The log tags. */
	logTags: string[];
};

type RouterConfig = {
	/** The media codecs. */
	mediaCodecs: object[];
};

type WebRTCTransportConfig = {
	/** The listening infos. */
	listenInfos: TransportListenInfo[];
	/** The maximum incoming bitrate. */
	maxIncomingBitrate: number;
	/** The initial available outgoing bitrate. */
	initialAvailableOutgoingBitrate: number;
};

type LauncherConfig = {
	/** Active adapter name (none, local, digitalocean). */
	activeAdapter: string;
	/** Local adapter settings. */
	local: {
		/** Maximum number of active local stage instances. */
		maxActiveStages: number;
	};
	/** DigitalOcean adapter settings. */
	digitalocean: {
		/** DigitalOcean API key. */
		apiKey: string;
		/** DigitalOcean region for droplet deployment. */
		region: string;
		/** Maximum number of VPN servers. */
		maxVpnServers: number;
	};
};

type MediasoupConfig = {
	/** The worker settings. */
	worker: WorkerConfig;
	/** The router settings. */
	router: RouterConfig;
	/** The WebRTC transport settings. */
	webRTCTransport: WebRTCTransportConfig;
};

/** The global runtime context */
type CONFIG = {
	/** Runtime Options */
	runtime: RuntimeConfig;
	/** Package Information */
	package: PackageConfig;
	/** Build Settings */
	build: BuildConfig;
	/** Debug Settings */
	debug: DebugConfig;
	/** Theater Settings */
	theater: TheaterConfig;
	/** Stage Settings */
	stage: StageConfig;
	/** Web Server Settings */
	web: WebConfig;
	/** Launcher Settings */
	launcher: LauncherConfig;
	/** MediaSoup Settings */
	mediasoup: MediasoupConfig;
};

declare global {
	let CONFIG: CONFIG;
}

export default global;
