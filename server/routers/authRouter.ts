import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { z } from "zod";
import { connectedUserProcedure, retrivePeerDetailsMiddleware } from "./userRouter";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure, middleware } = trpc();

/** Authentication session data */
interface AuthSession {
	peerId: string;
	expiresAt: number;
	authenticatedAt: number;
}

/** In-memory authentication session storage */
export const activeSessions = new Map<string, AuthSession>();

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
 * Authentication procedure middleware
 * Only allows signed in admin users to continue
 */
export const authenticateAdminMiddleware = middleware(({ ctx, next }) => {
	// When in stage mode all connected managers have admin access
	if (!CONFIG.runtime.theater) {
		if (!ctx.peer.manager) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Only managers are allowed to perform this action" });
		}

		return next({ ctx });
	}

	// Find out if the connection is authenticated
	cleanupExpiredSessions();
	if (!activeSessions.has(ctx.peer.id)) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Only signed-in users are allowed to perform this action" });
	}
	return next({ ctx });
});

/**
 * Authentication procedure
 * Only allows signed in admin users to continue
 */
export const authenticatedAdminProcedure = connectedUserProcedure.use(authenticateAdminMiddleware);

/**
 * Authentication Router - Handles secure theater authentication with session management
 */
export const authRouter = trcpRouter({
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
			if (input.password !== CONFIG.theater.password) {
				console.log(`[AuthRouter] Authentication failed for peer ${ctx.peer.id}: Invalid password`);
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

			console.log(`[AuthRouter] Authentication successful for peer ${ctx.peer.id}. Active sessions: ${activeSessions.size}`);

			return {
				success: true,
				expiresAt,
			};
		}),

	/**
	 * Validate existing session
	 */
	validateSession: trcpProcedure.query(async ({ ctx }) => {
		cleanupExpiredSessions();

		const session = activeSessions.get(ctx.peer.id);

		if (!session || session.expiresAt <= Date.now()) {
			console.log(`[AuthRouter] Session validation failed for peer ${ctx.peer.id}: Invalid or expired session`);
			return {
				valid: false,
				message: "Invalid or expired session",
			};
		}

		return {
			valid: true,
			expiresAt: session.expiresAt,
			remainingTime: session.expiresAt - Date.now(),
		};
	}),

	/**
	 * Invalidate (logout) session
	 */
	deauthenticate: trcpProcedure.mutation(async ({ ctx }) => {
		const session = activeSessions.get(ctx.peer.id);

		if (!session) {
			return {
				success: false,
				message: "Session not found or unauthorized",
			};
		}

		activeSessions.delete(ctx.peer.id);
		console.log(`[AuthRouter] Logout successful for peer ${ctx.peer.id}. Active sessions: ${activeSessions.size}`);

		return {
			success: true,
		};
	}),
});

/** Authentication Router Type */
export type AuthRouter = typeof authRouter;
