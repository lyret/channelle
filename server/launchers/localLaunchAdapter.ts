import { spawn, type ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import type { CanLaunchResult, LaunchResult, InstanceInfo, InstanceStatus } from "./types";
import { LaunchAdapter } from "./_abstractlaunchAdapter";
import type { Show } from "../models/Show";

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
	readonly displayName = "Samma server";

	private instances = new Map<string, LocalInstanceInfo>();
	private nextPort = 3001; // Start from port 3001 (main theater typically runs on 3000)

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
		const canLaunchResult = await this.canLaunch();
		if (!canLaunchResult.canLaunch) {
			throw new Error(canLaunchResult.reason || "Cannot launch instance");
		}

		const port = await this.findAvailablePort();
		if (!port) {
			throw new Error("No available port found");
		}

		const instanceId = this.generateInstanceId();
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
			},
		};

		// Store instance info
		this.instances.set(instanceId, instanceInfo);

		try {
			// Spawn the stage process
			const process = await this.spawnStageProcess(show.id, port);

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
	 * Find an available port for a new instance
	 */
	private async findAvailablePort(): Promise<number | null> {
		const maxAttempts = 100;
		let port = this.nextPort;

		for (let i = 0; i < maxAttempts; i++) {
			if (await this.isPortAvailable(port)) {
				this.nextPort = port + 1;
				return port;
			}
			port++;
		}

		return null;
	}

	/**
	 * Check if a port is available
	 */
	private async isPortAvailable(port: number): Promise<boolean> {
		// Check if any of our instances are using this port
		for (const instance of this.instances.values()) {
			if (instance.port === port && (instance.status === "running" || instance.status === "starting")) {
				return false;
			}
		}

		// Could add actual port checking here using net.createServer()
		// For now, just check against our instances
		return true;
	}

	/**
	 * Generate a unique instance ID
	 */
	private generateInstanceId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 8);
		return `local_${timestamp}_${random}`;
	}

	/**
	 * Spawn a new stage process
	 */
	private async spawnStageProcess(showId: number, port: number): Promise<ChildProcess> {
		// Verify that cli.mjs exists
		const cliPath = path.join(process.cwd(), "cli.mjs");
		try {
			await fs.access(cliPath);
		} catch {
			throw new Error(`CLI script not found at ${cliPath}`);
		}

		const args = ["cli.mjs", "--start", "--no-build", "--no-watch", "--no-theater", `--port=${port}`, `--showId=${showId}`, "--no-debug"];

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
				if (CONFIG.debug.verboseOutput) {
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
		childProcess.on("spawn", () => {
			console.log(`[LocalAdapter] Process spawned for instance '${instanceId}' (PID: ${childProcess.pid})`);

			// Give the process a moment to start up, then mark as running
			setTimeout(() => {
				if (instance.status === "starting") {
					instance.status = "running";
					console.log(`[LocalAdapter] Instance '${instanceId}' is now running`);
				}
			}, 2000);
		});

		childProcess.on("exit", (code, signal) => {
			console.log(`[LocalAdapter] Process exited for instance '${instanceId}' (code: ${code}, signal: ${signal})`);

			instance.status = "stopped";
		});

		childProcess.on("error", (error) => {
			console.error(`[LocalAdapter] Process error for instance '${instanceId}':`, error);

			instance.status = "error";
		});
	}
}
