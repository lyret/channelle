// Export types and interfaces
//export type { CanLaunchResult, LaunchResult, InstanceInfo, InstanceStatus } from "./types";

// Export registry functions
export * from "./_launchAdapterRegistry";

// Export types
export type { AdapterStatus, CanLaunchResult, LaunchResult, InstanceInfo, InstanceStatus } from "./types";

// Export adapters
export { NoneAdapter } from "./noneLaunchAdapter";
export { LocalAdapter } from "./localLaunchAdapter";
