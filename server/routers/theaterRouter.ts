import { trpc } from "../lib";
import { Peer } from "../models/Peer";
import { z } from "zod";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/** Theater session data */
interface TheaterSession {
	peerId: string;
	expiresAt: number;
	authenticatedAt: number;
}

/** In-memory session storage */
export const activeSessions = new Map<string, TheaterSession>();

/** Session expiration time: 8 hours in milliseconds */
const SESSION_EXPIRATION_TIME = 8 * 60 * 60 * 1000;

/**
 * Cleans up expired sessions
 */
function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [peerId, session] of activeSessions.entries()) {
		if (session.expiresAt <= now) {
			activeSessions.delete(peerId);
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
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Verify password
			if (input.password !== CONFIG.stage.theaterPassword) {
				console.log(`[TheaterRouter] Authentication failed for peer ${ctx.peer.id}: Invalid password`);
				return {
					success: false,
					message: "Invalid theater password",
				};
			}

			// Generate new session
			const now = Date.now();
			const expiresAt = now + SESSION_EXPIRATION_TIME;

			// Store session using peerId as key
			activeSessions.set(ctx.peer.id, {
				peerId: ctx.peer.id,
				expiresAt,
				authenticatedAt: now,
			});

			// Set peer as manager
			await setPeerAsManager(ctx.peer.id);

			console.log(`[TheaterRouter] Authentication successful for peer ${ctx.peer.id}. Active sessions: ${activeSessions.size}`);

			return {
				success: true,
				expiresAt,
			};
		}),

	/**
	 * Validate existing session
	 */
	validateSession: trcpProcedure.query(async ({ input, ctx }) => {
		cleanupExpiredSessions();

		const session = activeSessions.get(ctx.peer.id);

		if (!session || session.expiresAt <= Date.now()) {
			console.log(`[TheaterRouter] Session validation failed for peer ${ctx.peer.id}: Invalid or expired session`);
			return {
				valid: false,
				message: "Invalid or expired session",
			};
		}

		// Ensure peer still has manager status
		await setPeerAsManager(ctx.peer.id);

		return {
			valid: true,
			expiresAt: session.expiresAt,
			remainingTime: session.expiresAt - Date.now(),
		};
	}),

	/**
	 * Invalidate (logout) session
	 */
	logout: trcpProcedure.mutation(async ({ ctx }) => {
		const session = activeSessions.get(ctx.peer.id);

		if (!session) {
			return {
				success: false,
				message: "Session not found or unauthorized",
			};
		}

		activeSessions.delete(ctx.peer.id);
		console.log(`[TheaterRouter] Logout successful for peer ${ctx.peer.id}. Active sessions: ${activeSessions.size}`);

		return {
			success: true,
		};
	}),

	/**
	 * Fresh authentication check - validates current session without storing credentials
	 */
	refreshAuth: trcpProcedure.query(async ({ ctx }) => {
		cleanupExpiredSessions();

		const session = activeSessions.get(ctx.peer.id);
		const now = Date.now();

		if (!session || session.expiresAt <= now) {
			// Session is invalid or expired, remove it
			if (session) {
				activeSessions.delete(ctx.peer.id);
			}
			return {
				authenticated: false,
				message: "Session expired or invalid",
			};
		}

		return {
			authenticated: true,
			expiresAt: session.expiresAt,
			remainingTime: session.expiresAt - now,
		};
	}),
});

// Clean up expired sessions every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

/** Theater Router Type */
export type TheaterRouter = typeof theaterRouter;
