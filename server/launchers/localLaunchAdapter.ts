import { spawn, type ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import type { CanLaunchResult, LaunchResult, InstanceInfo, InstanceStatus } from "./types";
import { LaunchAdapter } from "./_abstractlaunchAdapter";
import type { Show } from "../models/Show";
import { Launch } from "../models/Launch";
import { v4 as uuidv4 } from "uuid";
import { generateUrlSlug } from "../../shared/utils/urlUtils";
import GetPort from "get-port";

/**
 * Information about a local instance process
 */
interface LocalInstanceInfo extends InstanceInfo {
	/** Child process handle */
	process?: ChildProcess;
	/** Process ID */
	pid?: number;
}

/**
 * Adapter for launching stage instances on the same machine
 *
 * This adapter spawns new Node.js processes running in stage mode on different ports.
 * Each instance runs independently and can be stopped individually.
 */
export class LocalAdapter extends LaunchAdapter {
	readonly name = "local";

	private instances = new Map<string, LocalInstanceInfo>();

	/**
	 * Check if we can launch more local instances
	 */
	async canLaunch(): Promise<CanLaunchResult> {
		const maxStages = CONFIG.launcher.local.maxActiveStages;
		const runningInstances = Array.from(this.instances.values()).filter((instance) => instance.status === "running" || instance.status === "starting");

		if (runningInstances.length >= maxStages) {
			return {
				canLaunch: false,
				reason: `Maximum number of local instances reached (${runningInstances.length}/${maxStages}). Stop an existing instance to launch a new one.`,
				details: {
					maxStages,
					runningInstances: runningInstances.length,
					instances: runningInstances.map((i) => ({ id: i.instanceId, port: i.port, status: i.status })),
				},
			};
		}

		// Check if we can find an available port
		const availablePort = await this.findAvailablePort();
		if (!availablePort) {
			return {
				canLaunch: false,
				reason: "No available ports found for launching new instance",
			};
		}

		return { canLaunch: true };
	}

	/**
	 * Launch a new local stage instance
	 */
	async launch(show: Show): Promise<LaunchResult> {
		// Check if there's already an instance for this show
		const existingInstance = Array.from(this.instances.values()).find(
			(instance) => instance.showId === show.id && (instance.status === "running" || instance.status === "starting"),
		);
		if (existingInstance) {
			throw new Error(`An instance for show "${show.name}" is already running (ID: ${existingInstance.instanceId})`);
		}

		const canLaunchResult = await this.canLaunch();
		if (!canLaunchResult.canLaunch) {
			throw new Error(canLaunchResult.reason || "Cannot launch instance");
		}

		const port = await this.findAvailablePort();
		if (!port) {
			throw new Error("No available port found");
		}

		// Generate a UUID for instanceId - this is guaranteed to be unique
		const instanceId = `local_${uuidv4()}`;
		const url = `http://localhost:${port}`;

		// Create instance info
		const instanceInfo: LocalInstanceInfo = {
			instanceId,
			showId: show.id,
			url,
			port,
			status: "starting",
			createdAt: new Date(),
			metadata: {
				showName: show.name,
				launchMethod: "local",
				urlPath: generateUrlSlug(show),
			},
		};

		// Store instance info
		this.instances.set(instanceId, instanceInfo);

		try {
			// Spawn the stage process
			const process = await this.spawnStageProcess(instanceInfo);

			// Update instance with process info
			instanceInfo.process = process;
			instanceInfo.pid = process.pid;

			// Set up process event handlers
			this.setupProcessHandlers(instanceId, process);

			console.log(`[LocalAdapter] Launched instance '${instanceId}' for show '${show.name}' on port ${port}`);

			return {
				instanceId,
				url,
				port,
				status: "starting",
				message: `Local stage instance launched on port ${port}`,
			};
		} catch (error) {
			// Clean up on error
			this.instances.delete(instanceId);
			throw new Error(`Failed to launch local instance: ${error.message}`);
		}
	}

	/**
	 * Stop a running instance
	 */
	async stop(instanceId: string): Promise<void> {
		const instance = this.instances.get(instanceId);
		if (!instance) {
			throw new Error(`Instance '${instanceId}' not found`);
		}

		if (instance.status === "stopped" || instance.status === "stopping") {
			return; // Already stopped or stopping
		}

		// Update status to stopping
		instance.status = "stopping";

		try {
			// Kill the process if it exists
			if (instance.process && !instance.process.killed) {
				instance.process.kill("SIGTERM");

				// Give it 5 seconds to terminate gracefully, then force kill
				setTimeout(() => {
					if (instance.process && !instance.process.killed) {
						console.log(`[LocalAdapter] Force killing instance '${instanceId}' (PID: ${instance.pid})`);
						instance.process.kill("SIGKILL");
					}
				}, 5000);
			}

			console.log(`[LocalAdapter] Stopped instance '${instanceId}' (PID: ${instance.pid})`);
		} catch (error) {
			console.error(`[LocalAdapter] Error stopping instance '${instanceId}':`, error);
		}
	}

	/**
	 * Get current status of an instance
	 */
	async getStatus(instanceId: string): Promise<InstanceStatus> {
		const instance = this.instances.get(instanceId);
		if (!instance) {
			throw new Error(`Instance '${instanceId}' not found`);
		}
		return instance.status;
	}

	/**
	 * Get all instances managed by this adapter
	 */
	async getInstances(): Promise<InstanceInfo[]> {
		return Array.from(this.instances.values()).map((instance) => ({
			instanceId: instance.instanceId,
			showId: instance.showId,
			url: instance.url,
			port: instance.port,
			status: instance.status,
			createdAt: instance.createdAt,
			metadata: instance.metadata,
		}));
	}

	/**
	 * Clean up all instances and resources
	 */
	async cleanup(): Promise<void> {
		const stopPromises = Array.from(this.instances.keys()).map((instanceId) =>
			this.stop(instanceId).catch((error) => console.error(`[LocalAdapter] Error stopping instance '${instanceId}' during cleanup:`, error)),
		);

		await Promise.all(stopPromises);

		// Wait a bit for processes to terminate
		await new Promise((resolve) => setTimeout(resolve, 1000));

		this.instances.clear();
		console.log("[LocalAdapter] Cleanup completed");
	}

	/**
	 * Find an available port for a new instance using get-port package
	 */
	private async findAvailablePort(): Promise<number | null> {
		// Get port range from configuration, with defaults
		const portRangeMin = CONFIG.launcher.local.portRangeMin || 3001;
		const portRangeMax = CONFIG.launcher.local.portRangeMax || 4000;

		// Get all ports currently in use by our instances
		const usedPorts = Array.from(this.instances.values())
			.filter((instance) => instance.status === "running" || instance.status === "starting")
			.map((instance) => instance.port);

		try {
			// Use get-port to find an available port in the specified range
			const availablePort = await GetPort({
				port: Array.from({ length: portRangeMax - portRangeMin + 1 }, (_, i) => portRangeMin + i),
				// Exclude ports that are already in use by our instances
				exclude: usedPorts,
			});

			return availablePort;
		} catch (error) {
			console.error(`[LocalAdapter] Error finding available port:`, error);
			return null;
		}
	}

	/**
	 * Spawn a new stage process
	 */
	private async spawnStageProcess(instanceInfo: LocalInstanceInfo): Promise<ChildProcess> {
		// Verify that cli.mjs exists
		const cliPath = path.join(process.cwd(), "cli.mjs");
		try {
			await fs.access(cliPath);
		} catch {
			throw new Error(`CLI script not found at ${cliPath}`);
		}

		const args = [
			"cli.mjs",
			"--start",
			"--build",
			"--no-theater",
			`--port=${instanceInfo.port}`,
			`--showId=${instanceInfo.showId}`,
			"--no-debug",
		];

		console.log(`[LocalAdapter] Spawning process: node ${args.join(" ")}`);

		const childProcess = spawn("node", args, {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"], // Capture stdout and stderr
			detached: false,
		});

		return childProcess;
	}

	/**
	 * Set up event handlers for a spawned process
	 */
	private setupProcessHandlers(instanceId: string, childProcess: ChildProcess): void {
		const instance = this.instances.get(instanceId);
		if (!instance) return;

		// Handle process output
		if (childProcess.stdout) {
			childProcess.stdout.on("data", (data) => {
				if (CONFIG.runtime.debug) {
					console.log(`[LocalAdapter:${instanceId}] stdout: ${data.toString().trim()}`);
				}
			});
		}

		if (childProcess.stderr) {
			childProcess.stderr.on("data", (data) => {
				console.error(`[LocalAdapter:${instanceId}] stderr: ${data.toString().trim()}`);
			});
		}

		// Handle process events
		childProcess.on("spawn", async () => {
			console.log(`[LocalAdapter] Process spawned for instance '${instanceId}' (PID: ${childProcess.pid})`);

			// Create Launch record
			try {
				await Launch.create({
					instanceId: instanceId,
					showId: instance.showId,
					url: instance.url,
					port: instance.port,
					status: "starting",
					stoppedAt: null,
				});
			} catch (error) {
				console.error("[LocalAdapter] Error creating launch record:", error);
			}

			// Give the process a moment to start up, then mark as running
			setTimeout(async () => {
				if (instance.status === "starting") {
					instance.status = "running";
					console.log(`[LocalAdapter] Instance '${instanceId}' is now running`);

					// Update Launch record
					Launch.update({ status: "running" }, { where: { instanceId: instanceId } }).catch((error) => {
						console.error("[LocalAdapter] Error updating launch status:", error);
					});
				}
			}, 2000);
		});

		childProcess.on("exit", (code, signal) => {
			console.log(`[LocalAdapter] Process exited for instance '${instanceId}' (code: ${code}, signal: ${signal})`);

			instance.status = "stopped";

			// Update Launch record with stopped time
			Launch.update(
				{
					status: "stopped",
					stoppedAt: new Date(),
				},
				{ where: { instanceId: instanceId } },
			).catch((error) => {
				console.error("[LocalAdapter] Error updating launch record:", error);
			});
		});

		childProcess.on("error", (error) => {
			console.error(`[LocalAdapter] Process error for instance '${instanceId}':`, error);

			instance.status = "error";

			// Update Launch record with error status
			Launch.update({ status: "error" }, { where: { instanceId: instanceId } }).catch((error) => {
				console.error("[LocalAdapter] Error updating launch error status:", error);
			});
		});
	}
}
