/**
 * Result of checking if an adapter can launch instances
 */
export interface CanLaunchResult {
	/** Whether the adapter can currently launch an instance */
	canLaunch: boolean;
	/** Human-readable reason if launch is not possible */
	reason?: string;
	/** Additional context data */
	details?: Record<string, any>;
}

/**
 * Result of launching an instance
 */
export interface LaunchResult {
	/** Unique identifier for the launched instance */
	instanceId: string;
	/** URL where the instance can be accessed */
	url: string;
	/** Port number if applicable (mainly for local instances) */
	port?: number;
	/** Current status of the instance */
	status: InstanceStatus;
	/** Additional message or details */
	message?: string;
}

/**
 * Information about an active instance
 */
export interface InstanceInfo {
	/** Unique identifier for the instance */
	instanceId: string;
	/** Show ID that this instance is running */
	showId: number;
	/** URL where the instance can be accessed */
	url: string;
	/** Port number if applicable */
	port?: number;
	/** Current status of the instance */
	status: InstanceStatus;
	/** When the instance was created */
	createdAt: Date;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * Status of a launched instance
 */
export type InstanceStatus = "starting" | "running" | "stopping" | "stopped" | "error";

/**
 * Adapter status information for UI
 */
export interface AdapterStatus {
	name: string;
	canLaunch: boolean;
	reason?: string;
	isActive: boolean;
}

/**
 * Launcher sync data from server
 */
export interface LauncherSyncData {
	/** Whether the launcher system is ready */
	isReady: boolean;
	/** Name of the active adapter */
	activeAdapter: string | null;
	/** Status of the active adapter */
	adapterStatus: AdapterStatus;
	/** List of all instances */
	instances: InstanceInfo[];
}

/**
 * Serialized version of InstanceInfo for client use
 * (Date objects become strings when serialized through tRPC)
 */
export interface InstanceInfoSerialized {
	/** Unique identifier for the instance */
	instanceId: string;
	/** Show ID that this instance is running */
	showId: number;
	/** URL where the instance can be accessed */
	url: string;
	/** Port number if applicable */
	port?: number;
	/** Current status of the instance */
	status: InstanceStatus;
	/** When the instance was created (serialized as string) */
	createdAt: string;
	/** Additional metadata */
	metadata?: Record<string, any>;
}

/**
 * Serialized launcher sync data for client use
 */
export interface LauncherSyncDataSerialized {
	/** Whether the launcher system is ready */
	isReady: boolean;
	/** Name of the active adapter */
	activeAdapter: string | null;
	/** Status of the active adapter */
	adapterStatus: AdapterStatus;
	/** List of all instances (with serialized dates) */
	instances: InstanceInfoSerialized[];
}
