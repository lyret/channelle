import { writable } from "svelte/store";
import { authClient } from "../_trpcClient";

/** Store for authentication state */
export const isTheaterAuthenticated = writable<boolean>(false);

/** Store for authentication loading state */
export const isAuthenticating = writable<boolean>(false);

/** Store for authentication error messages */
export const authError = writable<string>("");

// ============================================================================
// INTERNAL FUNCTIONS
// ============================================================================

/** Clear authentication data */
function clearAuthenticationData() {
	isTheaterAuthenticated.set(false);
	isAuthenticating.set(false);
	authError.set("");
}
/** Sets authentication data to signed in */
function okAuthenticationData() {
	isTheaterAuthenticated.set(true);
	isAuthenticating.set(false);
	authError.set("");
}

/**
 * Authenticate with theater password
 */
export async function authenticateTheater(password: string, name: string = "Admin"): Promise<boolean> {
	if (!password.trim()) {
		authError.set("Password is required");
		return false;
	}

	isAuthenticating.set(true);
	authError.set("");

	try {
		const result = await authClient.authenticate.mutate({
			name: name,
			teatherPassword: password.trim(),
		});

		if (result.success) {
			okAuthenticationData();
			return true;
		} else {
			clearAuthenticationData();
			authError.set("message" in result ? result.message : "Authentication failed");
			return false;
		}
	} catch (error) {
		console.error("[Authentication] Authentication error:", error);
		authError.set("Authentication failed. Please try again.");
		return false;
	} finally {
		isAuthenticating.set(false);
	}
}

/** Authenticate with username */
export async function authenticate(name: string = "") {
	await authClient.authenticate.mutate({ name });
}

/**
 * Sign out from theater admin mode
 */
export async function deauthenticateTheater(): Promise<void> {
	try {
		await authClient.deauthenticate.mutate();
	} catch (error) {
		console.warn("[Authentication] Error while deauthenticating theater:", error);
	}

	clearAuthenticationData();
}

/**
 * Validate session with server
 */
export async function validateSessionWithServer(): Promise<boolean> {
	try {
		isAuthenticating.set(true);

		const result = await authClient.validateAdminAuthentication.query();

		if (result.valid) {
			okAuthenticationData();
			return true;
		} else {
			clearAuthenticationData();
			return false;
		}
	} catch (error) {
		console.error("[Authentication] Error validating session with server:", error);
		clearAuthenticationData();
		return false;
	} finally {
		isAuthenticating.set(false);
	}
}

/** Utility function to instantly clear the authentication error */
export function clearAuthError() {
	authError.set("");
}
