import type { CanLaunchResult, LaunchResult, InstanceInfo, InstanceStatus } from "./types";
import { LaunchAdapter } from "./_abstractlaunchAdapter";
import type { Show } from "../models/Show";

/**
 * Default adapter, provides no actual launching capability
 *
 * This adapter serves as a safe default when no specific launcher is configured.
 * It always reports that it cannot launch instances and maintains no state.
 */
export class NoneAdapter extends LaunchAdapter {
	readonly name = "none";
	readonly displayName = "Ingen";

	/**
	 * Always returns false - this adapter cannot launch anything
	 */
	async canLaunch(): Promise<CanLaunchResult> {
		return {
			canLaunch: false,
			reason: "No launcher adapter is avaiable/set.",
		};
	}

	/**
	 * Always throws an error - this adapter cannot launch
	 */
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	async launch(_: Show): Promise<LaunchResult> {
		throw new Error("Cannot launch instances: No launcher adapter is configured");
	}

	/**
	 * Always throws an error - this adapter manages no instances
	 */
	async stop(instanceId: string): Promise<void> {
		throw new Error(`Cannot stop instance '${instanceId}': No launcher adapter is configured`);
	}

	/**
	 * Always throws an error - this adapter manages no instances
	 */
	async getStatus(instanceId: string): Promise<InstanceStatus> {
		throw new Error(`Cannot get status for instance '${instanceId}': No launcher adapter is configured`);
	}

	/**
	 * Always returns empty array - this adapter manages no instances
	 */
	async getInstances(): Promise<InstanceInfo[]> {
		return [];
	}

	/**
	 * No-op cleanup - this adapter has no resources to clean up
	 */
	async cleanup(): Promise<void> {
		// Nothing to clean up
	}
}
