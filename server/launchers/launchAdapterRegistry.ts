import type { LaunchAdapter } from "./_abstractlaunchAdapter";
import type { AdapterStatus } from "./types";
import { NoneAdapter } from "./noneLaunchAdapter";
import { LocalAdapter } from "./localLaunchAdapter";

/** In-memory active adapter */
let _activeAdapter: LaunchAdapter | null = null;

/** In-memory state of initialization */
let _isInitialized = false;

/** In-memory registry of registred launchers */
const _adapters = new Map<string, LaunchAdapter>();

/** Returns the name of all initialized launcher adapters */
export function getAllLauncherAdapters(): string[] {
	return Array.from(_adapters.keys());
}

/** Returns the currently active adapter */
export function getActiveAdapter(): LaunchAdapter | null {
	return _activeAdapter;
}

/** Returns whenever any launcher adapter is ready to use */
export function isLauncherReady(): boolean {
	return _isInitialized && _activeAdapter !== null;
}

/** Returns the current adapter status for UI display */
export async function getAdapterStatus(): Promise<AdapterStatus> {
	if (!_activeAdapter || !_isInitialized) {
		return {
			name: "none",
			canLaunch: false,
			reason: "Launcher system not initialized",
			isActive: true,
		};
	}

	try {
		const canLaunchResult = await _activeAdapter.canLaunch();
		return {
			name: _activeAdapter.name,
			canLaunch: canLaunchResult.canLaunch,
			reason: canLaunchResult.reason,
			isActive: true,
		};
	} catch (error) {
		return {
			name: _activeAdapter.name,
			canLaunch: false,
			reason: `Error checking launch capability: ${error.message}`,
			isActive: true,
		};
	}
}

/** Change to a different adapter at runtime */
export async function switchAdapter(adapterName: string): Promise<void> {
	if (!_isInitialized) {
		throw new Error("Launcher system not initialized");
	}

	const newAdapter = _adapters.get(adapterName);
	if (!newAdapter) {
		throw new Error(`Unknown adapter: ${adapterName}`);
	}

	if (_activeAdapter && _activeAdapter.name === adapterName) {
		console.log(`[Launchers] Already using ${adapterName} adapter`);
		return;
	}

	console.log(`[Launchers] Switching from ${_activeAdapter?.name || "none"} to ${adapterName}`);
	_activeAdapter = newAdapter;
}

/**
 * Initialize all avaiable launcher adapters
 *
 * This should be called during server startup in theater mode to initialize
 * the launcher system with the configured adapter.
 *
 * @returns Promise that resolves when all launchers are ready
 */
export async function initializeAllLaunchers(): Promise<void> {
	// Only initialize when in theater mode
	if (!CONFIG.runtime.theater) {
		console.log("[Launchers] Skipping initialization (not in theater mode)");
		return;
	}

	if (_isInitialized) {
		console.warn("[Launchers] Already initialized, skipping...");
		return;
	}

	const adapterName = CONFIG.launcher.activeAdapter;
	console.log(`[Launchers] Initializing with adapter: ${adapterName}`);

	// Register available adapters
	try {
		// Register the none adapter (always available)
		initializeAdapter(new NoneAdapter());

		// Register local adapter (always available)
		initializeAdapter(new LocalAdapter());

		// TODO: Register DigitalOcean adapter when implemented
		// if (CONFIG.launcher.digitalocean.apiKey) {
		// initializeAdapter(new DigitalOceanAdapter());
		// }

		console.log(`[Launchers] Initialized ${_adapters.size} adapters: ${getAllLauncherAdapters().join(", ")}`);

		// Get and activate the configured adapter
		const adapter = _adapters.get(adapterName);
		if (!adapter) {
			throw new Error(`Unknown adapter: ${adapterName}`);
		}

		_activeAdapter = adapter;
		_isInitialized = true;

		console.log(`[Launchers] Successfully initialized with ${adapter.name} adapter`);
	} catch (error) {
		console.error("[Launchers] Failed to initialize:", error);
		// Fall back to none adapter on error
		const noneAdapter = _adapters.get("none");
		if (noneAdapter) {
			_activeAdapter = noneAdapter;
			_isInitialized = true;
			console.log("[Launchers] Fell back to NoneAdapter due to initialization error");
		} else {
			throw error;
		}
	}
}

/**
 * Makes a given launcher adapter available
 * @param adapter - The adapter to register
 * @throws Error if adapter name is already registered pr could not be initialized
 */
function initializeAdapter(adapter: LaunchAdapter): void {
	try {
		if (_adapters.has(adapter.name)) {
			throw new Error(`Adapter with name '${adapter.name}' is already registered`);
		}

		_adapters.set(adapter.name, adapter);
		if (CONFIG.runtime.verbose) {
			console.log(`[Launchers] Registered adapter: ${adapter.name}`);
		}
	} catch (error) {
		console.error("[Launchers] Error registering adapter:", error);
	}
}
