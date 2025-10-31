import { writable, get } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { stageClient } from "~/api/_trpcClient";

// 8 hours in milliseconds
const AUTH_EXPIRATION_TIME = 8 * 60 * 60 * 1000;

interface TheaterAuthData {
	isAuthenticated: boolean;
	token: string;
	expiresAt: number;
}

/** Store for theater authentication state with 8-hour expiration - persisted across sessions */
const theaterAuthData = persisted<TheaterAuthData>(`${CONFIG.stage.id}-theater-auth-data`, {
	isAuthenticated: false,
	token: "",
	expiresAt: 0,
});

/** Derived store for authentication state */
export const isTheaterAuthenticated = writable<boolean>(false);

/** Store for authentication loading state */
export const isAuthenticating = writable<boolean>(false);

/** Store for authentication error messages */
export const authError = writable<string>("");

/** Initialize authentication state on app startup */
function initializeAuth() {
	theaterAuthData.subscribe((data) => {
		const now = Date.now();

		// Check if authentication is still valid
		if (data.isAuthenticated && data.token && data.expiresAt > now) {
			isTheaterAuthenticated.set(true);
		} else if (data.expiresAt > 0 && data.expiresAt <= now) {
			// Authentication expired, clear it
			console.log("Theater authentication expired, clearing stored data");
			clearAuthData();
		} else {
			isTheaterAuthenticated.set(false);
		}
	});
}

/** Clear authentication data */
function clearAuthData() {
	theaterAuthData.set({
		isAuthenticated: false,
		token: "",
		expiresAt: 0,
	});
	isTheaterAuthenticated.set(false);
}

/** Authenticate with theater password */
export async function authenticateTheater(password: string): Promise<boolean> {
	if (!password.trim()) {
		authError.set("Password is required");
		return false;
	}

	isAuthenticating.set(true);
	authError.set("");

	try {
		const result = await stageClient.authenticateTheater.mutate({
			password: password.trim(),
		});

		if (result.success) {
			const now = Date.now();
			const expiresAt = now + AUTH_EXPIRATION_TIME;

			// Store authentication data with expiration
			theaterAuthData.set({
				isAuthenticated: true,
				token: `theater-authenticated-${now}`,
				expiresAt: expiresAt,
			});

			isTheaterAuthenticated.set(true);
			console.log("Theater authentication successful, expires at:", new Date(expiresAt).toLocaleString());
			return true;
		} else {
			authError.set(result.message || "Authentication failed");
			return false;
		}
	} catch (error) {
		console.error("Authentication error:", error);
		authError.set("Authentication failed. Please try again.");
		return false;
	} finally {
		isAuthenticating.set(false);
	}
}

/** Sign out from theater */
export function signOut() {
	clearAuthData();
	authError.set("");
	console.log("Signed out from theater");
}

/** Check if user has valid authentication token on app startup */
export function validateStoredAuth(): boolean {
	const data = get(theaterAuthData);
	const now = Date.now();

	// Check if we have valid authentication data that hasn't expired
	if (data.isAuthenticated && data.token && data.expiresAt > now) {
		console.log("Valid theater authentication found in storage, expires at:", new Date(data.expiresAt).toLocaleString());
		isTheaterAuthenticated.set(true);
		return true;
	} else if (data.expiresAt > 0 && data.expiresAt <= now) {
		// Authentication expired
		console.log("Theater authentication expired, clearing stored data");
		clearAuthData();
		return false;
	} else {
		// No valid authentication found
		clearAuthData();
		return false;
	}
}

/** Get remaining authentication time in minutes */
export function getRemainingAuthTime(): number {
	const data = get(theaterAuthData);
	const now = Date.now();

	if (data.expiresAt > now) {
		return Math.floor((data.expiresAt - now) / (1000 * 60));
	}

	return 0;
}

/** Clear authentication error */
export function clearAuthError() {
	authError.set("");
}

// Initialize authentication state
initializeAuth();

/** Test function to verify authentication persistence (for development) */
export function testAuthPersistence() {
	console.log("🧪 Testing theater authentication persistence...");

	const data = get(theaterAuthData);
	const now = Date.now();

	console.log("Current auth data:", {
		isAuthenticated: data.isAuthenticated,
		hasToken: !!data.token,
		expiresAt: data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "Never",
		remainingMinutes: getRemainingAuthTime(),
		isExpired: data.expiresAt > 0 && data.expiresAt <= now,
	});

	console.log("Store state:", {
		isTheaterAuthenticated: get(isTheaterAuthenticated),
		authError: get(authError),
		isAuthenticating: get(isAuthenticating),
	});

	// Test validation
	const isValid = validateStoredAuth();
	console.log("Validation result:", isValid);

	return {
		data,
		isValid,
		remainingMinutes: getRemainingAuthTime(),
	};
}
