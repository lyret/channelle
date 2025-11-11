/* eslint-disable no-unused-vars */
import type { CanLaunchResult, LaunchResult, InstanceStatus, InstanceInfo } from "./types";
import type { Show } from "../models/Show";

/**
 * Base class for all launcher adapters
 */

export abstract class LaunchAdapter {
	/** Unique name of this adapter (used for identification) */
	abstract readonly name: string;

	/** Human-readable display name for UI */
	abstract readonly displayName: string;

	/**
	 * Check if this adapter can currently launch instances
	 * @returns Promise resolving to launch capability information
	 */
	abstract canLaunch(): Promise<CanLaunchResult>;

	/**
	 * Launch a new instance for the given show
	 * @param show - The show configuration to launch
	 * @returns Promise resolving to launch result
	 */
	abstract launch(show: Show): Promise<LaunchResult>;

	/**
	 * Stop a running instance
	 * @param instanceId - ID of the instance to stop
	 * @returns Promise that resolves when instance is stopped
	 */
	abstract stop(instanceId: string): Promise<void>;

	/**
	 * Get current status of a specific instance
	 * @param instanceId - ID of the instance to check
	 * @returns Promise resolving to current status
	 */
	abstract getStatus(instanceId: string): Promise<InstanceStatus>;

	/**
	 * Get information about all instances managed by this adapter
	 * @returns Promise resolving to array of instance information
	 */
	abstract getInstances(): Promise<InstanceInfo[]>;

	/**
	 * Clean up any resources when adapter is being destroyed
	 * @returns Promise that resolves when cleanup is complete
	 */
	abstract cleanup(): Promise<void>;
}
