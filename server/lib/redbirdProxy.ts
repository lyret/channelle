import * as Redbird from "redbird";
import type { Server } from "http";

/**
 * Redbird Proxy Manager
 *
 * Manages dynamic reverse proxy routing for stage instances
 */
export class RedbirdProxy {
	private proxy: any;
	private httpServer: Server | null = null;
	private isInitialized = false;
	private registeredRoutes = new Map<string, string>(); // instanceId -> pathname
	private theaterServerUrl: string = "http://localhost:" + (CONFIG.web?.port || 3000);

	/**
	 * Initialize the Redbird proxy
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		try {
			const proxyPort = CONFIG.launcher?.local?.proxyPort || 8080;
			const proxyOptions = {
				port: proxyPort,
				xfwd: true, // Forward X-Forwarded-For headers
				bunyan: CONFIG.runtime.debug
					? {
							name: "redbird",
							level: "debug",
							stream: process.stdout,
						}
					: false,
			};

			console.log(`[RedbirdProxy] Initializing on port ${proxyPort}`);
			this.proxy = new Redbird.Redbird(proxyOptions);
			this.isInitialized = true;

			// Store reference to the HTTP server for cleanup
			this.httpServer = this.proxy.server;

			// Set up theater server as default target
			this.theaterServerUrl = `http://localhost:${CONFIG.web.port}`;

			// Set up default routing: theater server handles / and /preparation
			this.setupDefaultRouting();

			console.log(`[Proxy] Successfully initialized on port ${proxyPort}`);
		} catch (error) {
			console.error("[Proxy] Failed to initialize:", error);
			throw error;
		}
	}

	/**
	 * Set up default routing rules
	 * - / and /preparation go to theater server
	 * - Other paths go to instances or 404
	 */
	private setupDefaultRouting(): void {
		if (!this.proxy) {
			console.error("[Proxy] Cannot setup routing - proxy not initialized");
			return;
		}

		// Register theater server routes
		console.log("[Proxy] Setting up theater routes for / and /preparation");
		this.proxy.register(this.theaterServerUrl + "/", this.theaterServerUrl);
		this.proxy.register(this.theaterServerUrl + "/preparation", this.theaterServerUrl);

		// Set theater server as fallback for 404
		console.log("[Proxy] Setting theater server as fallback for unregistered paths");
		this.proxy.register(this.theaterServerUrl + "/*", this.theaterServerUrl);
	}

	/**
	 * Register a new route for a stage instance
	 *
	 * @param instanceId - Unique instance identifier
	 * @param targetUrl - Direct URL to the stage instance (e.g., http://localhost:3001)
	 * @param pathname - The path to register (e.g., "/hamlet")
	 * @returns The proxy URL for accessing the instance
	 */
	registerRoute(instanceId: string, targetUrl: string, pathname: string): string {
		if (!this.isInitialized) {
			throw new Error("Proxy is not initialized");
		}

		try {
			// Register the path-based route
			this.proxy.register(this.theaterServerUrl + pathname, targetUrl);
			this.registeredRoutes.set(instanceId, pathname);

			console.log(`[Proxy] Registered route: ${pathname} -> ${targetUrl}`);

			// Return the proxy URL
			const proxyPort = CONFIG.launcher?.local?.proxyPort || 8080;
			const proxyDomain = CONFIG.launcher?.local?.proxyDomain || "localhost";
			return `http://${proxyDomain}:${proxyPort}${pathname}`;
		} catch (error) {
			console.error(`[Proxy] Failed to register route for ${instanceId}:`, error);
			throw error;
		}
	}

	/**
	 * Unregister a route for a stopped instance
	 *
	 * @param instanceId - Unique instance identifier
	 */
	unregisterRoute(instanceId: string): void {
		if (!this.isInitialized) {
			console.warn("[RedbirdProxy] Proxy not initialized, skipping unregister");
			return;
		}

		const pathname = this.registeredRoutes.get(instanceId);
		if (!pathname) {
			console.warn(`[Proxy] No registered route found for instance ${instanceId}`);
			return;
		}

		try {
			this.proxy.unregister(pathname, pathname); // Unregister the route
			this.registeredRoutes.delete(instanceId);

			console.log(`[Proxy] Unregistered route: ${pathname}`);
		} catch (error) {
			console.error(`[RedbirdProxy] Failed to unregister route for ${instanceId}:`, error);
		}
	}

	/**
	 * Clean up all resources
	 */
	async cleanup(): Promise<void> {
		if (!this.isInitialized) {
			return;
		}

		try {
			// Unregister all routes
			for (const hostname of this.registeredRoutes.values()) {
				try {
					this.proxy.unregister(hostname, hostname);
				} catch (error) {
					console.error(`[RedbirdProxy] Error unregistering route ${hostname}:`, error);
				}
			}
			this.registeredRoutes.clear();

			// Close the HTTP server
			if (this.httpServer) {
				await new Promise<void>((resolve, reject) => {
					this.httpServer?.close((error) => {
						if (error) {
							console.error("[RedbirdProxy] Error closing HTTP server:", error);
							reject(error);
						} else {
							console.log("[RedbirdProxy] HTTP server closed");
							resolve();
						}
					});
				});
			}

			this.isInitialized = false;
			console.log("[RedbirdProxy] Cleanup completed");
		} catch (error) {
			console.error("[RedbirdProxy] Error during cleanup:", error);
		}
	}

	/**
	 * Check if proxy is initialized
	 */
	isReady(): boolean {
		return this.isInitialized;
	}

	/**
	 * Get the proxy URL for an instance
	 */
	getProxyUrl(instanceId: string): string | null {
		const pathname = this.registeredRoutes.get(instanceId);
		if (!pathname) return null;
		return `http://${CONFIG.launcher.local.proxyDomain || "localhost"}:${CONFIG.launcher.local.proxyPort || 8080}${pathname}`;
	}

	/**
	 * Get the proxy instance (for advanced usage)
	 */
	getProxyInstance(): any {
		return this.proxy;
	}
}

// Singleton instance
let proxyInstance: RedbirdProxy | null = null;

/**
 * Get the global Redbird proxy instance
 */
export function getRedbirdProxy(): RedbirdProxy {
	if (!proxyInstance) {
		proxyInstance = new RedbirdProxy();
	}
	return proxyInstance;
}
