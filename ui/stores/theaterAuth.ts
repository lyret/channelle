import { writable, get } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { theaterClient } from "~/api";

interface TheaterAuthData {
	isAuthenticated: boolean;
	sessionId: string;
	peerId: string;
	expiresAt: number;
}

/** Store for theater authentication state with 8-hour expiration - persisted across sessions */
const theaterAuthData = persisted<TheaterAuthData>(`${CONFIG.stage.id}-theater-auth-data`, {
	isAuthenticated: false,
	sessionId: "",
	peerId: "",
	expiresAt: 0,
});

/** Derived store for authentication state */
export const isTheaterAuthenticated = writable<boolean>(false);

/** Store for authentication loading state */
export const isAuthenticating = writable<boolean>(false);

/** Store for session validation loading state */
export const isValidatingSession = writable<boolean>(false);

/** Store for authentication error messages */
export const authError = writable<string>("");

/** Generate a unique peer ID for this browser session */
function generatePeerId(): string {
	const timestamp = Date.now().toString(36);
	const randomBytes = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256));
	const randomString = randomBytes.map((b) => b.toString(36)).join("");
	return `peer_${timestamp}_${randomString}`;
}

/** Get or create peer ID */
function getPeerId(): string {
	const stored = localStorage.getItem(`${CONFIG.stage.id}-peer-id`);
	if (stored) {
		return stored;
	}

	const newPeerId = generatePeerId();
	localStorage.setItem(`${CONFIG.stage.id}-peer-id`, newPeerId);
	return newPeerId;
}

/** Clear authentication data */
function clearAuthData() {
	theaterAuthData.set({
		isAuthenticated: false,
		sessionId: "",
		peerId: "",
		expiresAt: 0,
	});
	isTheaterAuthenticated.set(false);
}

/** Validate session with server */
async function validateSessionWithServer(sessionId: string, peerId: string): Promise<boolean> {
	try {
		isValidatingSession.set(true);

		const result = await theaterClient.validateSession.query({
			sessionId,
			peerId,
		});

		if (result.valid && "expiresAt" in result) {
			theaterAuthData.update((data) => ({
				...data,
				expiresAt: result.expiresAt,
			}));
			return true;
		} else {
			clearAuthData();
			return false;
		}
	} catch (error) {
		console.error("[TheaterAuth] Error validating session with server:", error);
		return false;
	} finally {
		isValidatingSession.set(false);
	}
}

/** Check if we need to validate with server */
function needsServerValidation(): boolean {
	return Math.random() < 0.1; // 10% chance to validate
}

/** Initialize authentication state on app startup */
function initializeAuth() {
	// Check initial state synchronously
	const initialData = get(theaterAuthData);
	const now = Date.now();

	if (!initialData.sessionId || !initialData.peerId || initialData.expiresAt <= now) {
		clearAuthData();
	} else {
		isTheaterAuthenticated.set(true);
	}

	// Subscribe to future changes
	theaterAuthData.subscribe((data) => {
		const currentTime = Date.now();

		if (!data.sessionId || !data.peerId || data.expiresAt <= currentTime) {
			isTheaterAuthenticated.set(false);
			return;
		}

		isTheaterAuthenticated.set(true);
	});
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
		const peerId = getPeerId();

		const result = await theaterClient.authenticate.mutate({
			password: password.trim(),
			peerId,
		});

		if (result.success && "sessionId" in result && "expiresAt" in result) {
			theaterAuthData.set({
				isAuthenticated: true,
				sessionId: result.sessionId,
				peerId,
				expiresAt: result.expiresAt,
			});

			isTheaterAuthenticated.set(true);
			return true;
		} else {
			authError.set("message" in result ? result.message : "Authentication failed");
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
export async function signOut(): Promise<void> {
	const data = get(theaterAuthData);

	if (data.sessionId && data.peerId) {
		try {
			await theaterClient.logout.mutate({
				sessionId: data.sessionId,
				peerId: data.peerId,
			});
		} catch {
			// Continue with local cleanup even if server logout fails
		}
	}

	clearAuthData();
	authError.set("");
}

/** Ensure user is authenticated (validate with server if needed) */
export async function ensureAuthenticated(): Promise<boolean> {
	const data = get(theaterAuthData);
	const now = Date.now();

	if (!data.sessionId || !data.peerId || data.expiresAt <= now) {
		clearAuthData();
		return false;
	}

	if (needsServerValidation()) {
		return await validateSessionWithServer(data.sessionId, data.peerId);
	}

	return true;
}

/** Force validate session with server */
export async function validateSession(): Promise<boolean> {
	const data = get(theaterAuthData);

	if (!data.sessionId || !data.peerId) {
		clearAuthData();
		return false;
	}

	return await validateSessionWithServer(data.sessionId, data.peerId);
}

/** Check if user has valid authentication token on app startup */
export function validateStoredAuth(): boolean {
	const data = get(theaterAuthData);
	const now = Date.now();

	if (data.isAuthenticated && data.sessionId && data.peerId && data.expiresAt > now) {
		isTheaterAuthenticated.set(true);
		return true;
	} else {
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

/** Get current peer ID */
export function getCurrentPeerId(): string {
	const data = get(theaterAuthData);
	return data.peerId || getPeerId();
}

// Initialize authentication state
initializeAuth();

/** Test function to verify authentication persistence and server validation (for development) */
export async function testAuthPersistence() {
	const data = get(theaterAuthData);

	console.log("Current auth data:", {
		isAuthenticated: data.isAuthenticated,
		hasSessionId: !!data.sessionId,
		peerId: data.peerId,
		expiresAt: data.expiresAt ? new Date(data.expiresAt).toLocaleString() : "Never",
		remainingMinutes: getRemainingAuthTime(),
	});

	const isValid = validateStoredAuth();

	if (data.sessionId && data.peerId) {
		const serverValid = await validateSessionWithServer(data.sessionId, data.peerId);
		return { data, isValid, serverValid, remainingMinutes: getRemainingAuthTime() };
	}

	return { data, isValid, remainingMinutes: getRemainingAuthTime() };
}
