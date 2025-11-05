import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { Peer } from "../models/Peer";
import { z } from "zod";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/** Theater session data */
interface TheaterSession {
	sessionId: string;
	peerId: string;
	expiresAt: number;
}

/** In-memory session storage */
const activeSessions = new Map<string, TheaterSession>();

/** Session expiration time: 8 hours in milliseconds */
const SESSION_EXPIRATION_TIME = 8 * 60 * 60 * 1000;

/**
 * Generates a secure session ID
 */
function generateSessionId(): string {
	const timestamp = Date.now().toString(36);
	const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
	const randomString = randomBytes.map((b) => b.toString(36)).join("");
	return `theater_${timestamp}_${randomString}`;
}

/**
 * Cleans up expired sessions
 */
function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [sessionId, session] of activeSessions.entries()) {
		if (session.expiresAt <= now) {
			activeSessions.delete(sessionId);
		}
	}
}

/**
 * Sets a peer as manager in the database
 */
async function setPeerAsManager(peerId: string): Promise<void> {
	const [peer] = await Peer.findOrCreate({
		where: { id: peerId },
		defaults: {
			id: peerId,
			name: "Theater Manager",
			manager: true,
			actor: false,
			banned: false,
			audioMuted: false,
			videoMuted: false,
			online: true,
		},
	});

	if (!peer.manager) {
		await peer.update({ manager: true });
	}
}

/**
 * Theater Router - Handles secure theater authentication with session management
 */
export const theaterRouter = trcpRouter({
	/**
	 * Authenticate with theater password and create session
	 */
	authenticate: trcpProcedure
		.input(
			z.object({
				password: z.string().min(1, "Password is required"),
				peerId: z.string().min(1, "Peer ID is required"),
			}),
		)
		.mutation(async ({ input }) => {
			// Verify password
			if (input.password !== CONFIG.stage.theaterPassword) {
				return {
					success: false,
					message: "Invalid theater password",
				};
			}

			// Generate new session
			const sessionId = generateSessionId();
			const expiresAt = Date.now() + SESSION_EXPIRATION_TIME;

			// Store session
			activeSessions.set(sessionId, {
				sessionId,
				peerId: input.peerId,
				expiresAt,
			});

			// Set peer as manager
			await setPeerAsManager(input.peerId);

			return {
				success: true,
				sessionId,
				expiresAt,
			};
		}),

	/**
	 * Validate existing session
	 */
	validateSession: trcpProcedure
		.input(
			z.object({
				sessionId: z.string().min(1, "Session ID is required"),
				peerId: z.string().min(1, "Peer ID is required"),
			}),
		)
		.query(async ({ input }) => {
			cleanupExpiredSessions();

			const session = activeSessions.get(input.sessionId);

			if (!session || session.peerId !== input.peerId || session.expiresAt <= Date.now()) {
				return {
					valid: false,
					message: "Invalid or expired session",
				};
			}

			// Ensure peer still has manager status
			await setPeerAsManager(input.peerId);

			return {
				valid: true,
				expiresAt: session.expiresAt,
				remainingTime: session.expiresAt - Date.now(),
			};
		}),

	/**
	 * Invalidate (logout) session
	 */
	logout: trcpProcedure
		.input(
			z.object({
				sessionId: z.string().min(1, "Session ID is required"),
				peerId: z.string().min(1, "Peer ID is required"),
			}),
		)
		.mutation(async ({ input }) => {
			const session = activeSessions.get(input.sessionId);

			if (!session || session.peerId !== input.peerId) {
				return {
					success: false,
					message: "Session not found or unauthorized",
				};
			}

			activeSessions.delete(input.sessionId);

			return {
				success: true,
			};
		}),
});

// Clean up expired sessions every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

/** Theater Router Type */
export type TheaterRouter = typeof theaterRouter;
