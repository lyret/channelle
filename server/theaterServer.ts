import { initializeAllLaunchers, getActiveAdapter } from "./launchers";
import { createServer } from "./_server";
import { seedShows } from "./_seedDatabase";
import { Show } from "./models/Show";
import { Launch } from "./models/Launch";

// Only launch this file when built for theater mode
if (!CONFIG.runtime.theater) {
	throw new Error("This file should not be executed directly when built for stage mode.");
}

// Initialize all server launchers
try {
	await initializeAllLaunchers();
} catch (error) {
	console.error("[Server] Failed to initialize launchers:", error);
	// Don't fail server startup, but log the error
}

// Starts the server when this file is executed
await createServer();

// Seed the database with shows if needed
try {
	await seedShows();
} catch (error) {
	console.error("[Server] Failed to seed shows:", error);
	// Don't fail server startup, but log the error
}

/**
 * Check for running servers using the active launch adapter and update database
 */
async function checkForRunningServersAndUpdateDatabase(): Promise<void> {
	console.log("[Server] Checking for running servers...");

	const activeAdapter = getActiveAdapter();
	if (!activeAdapter) {
		console.log("[Server] No active adapter, skipping server check");
		return;
	}

	try {
		// Get running instances from the adapter
		const runningInstances = await activeAdapter.getInstances();
		const runningInstancesMap = new Map(runningInstances.map((instance) => [instance.instanceId, instance]));

		// Get existing launches from database
		const existingLaunches = await Launch.findAll();
		const existingLaunchesMap = new Map(existingLaunches.map((launch) => [launch.instanceId, launch]));

		// Update existing launches that are still running
		for (const [instanceId, launch] of existingLaunchesMap) {
			if (runningInstancesMap.has(instanceId)) {
				// Launch is still running, update status if needed
				const runningInstance = runningInstancesMap.get(instanceId);
				if (launch.status !== runningInstance.status) {
					await launch.update({
						status: runningInstance.status,
						stoppedAt: null, // Clear stoppedAt if it was set
					});
					console.log(`[Server] Updated launch ${launch.id} status to ${runningInstance.status}`);
				}
			} else if (launch.status !== "stopped") {
				// Launch is no longer running, mark as stopped
				await launch.update({
					status: "stopped",
					stoppedAt: new Date(),
				});
				console.log(`[Server] Marked launch ${launch.id} as stopped`);
			}
		}

		// Create new launches for running instances that don't have database records
		for (const [instanceId, instance] of runningInstancesMap) {
			if (!existingLaunchesMap.has(instanceId)) {
				// Find the show for this instance (if possible)
				let showId = null;
				if (instance.showId) {
					const show = await Show.findByPk(instance.showId);
					if (show) {
						showId = show.id;
					}
				}

				// Create new launch record
				const newLaunch = await Launch.create({
					instanceId: instance.instanceId,
					showId: showId,
					url: instance.url,
					port: instance.port,
					status: instance.status,
					stoppedAt: null,
				});

				console.log(`[Server] Created new launch record ${newLaunch.id} for running instance ${instanceId}`);
			}
		}

		console.log(`[Server] Server check complete: ${runningInstances.length} running instances, ${existingLaunches.length} launch records`);
	} catch (error) {
		console.error("[Server] Error checking running servers:", error);
		throw error;
	}
}

// Check for running servers and update database
try {
	await checkForRunningServersAndUpdateDatabase();
} catch (error) {
	console.error("[Server] Failed to check for running servers:", error);
	// Don't fail server startup, but log the error
}
