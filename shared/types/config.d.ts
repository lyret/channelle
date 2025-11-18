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
	/** The slug identifier for the deployment. */
	slug: string;
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

type TheaterConfig = {
	/** The password for administrator authentication. */
	password: string;
};

type ShowDefaults = {
	/** The name of the show. */
	name: string;
	/** The password for the show. */
	password: string;
};

type BackstageConfig = {
	/** The show ID to initialize the stage with (optional). */
	showId?: number;
	/** Default show configuration. */
	showDefaults: ShowDefaults;
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
	/** Theater Settings */
	theater: TheaterConfig;
	/** Backstage Settings */
	backstage: BackstageConfig;
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
