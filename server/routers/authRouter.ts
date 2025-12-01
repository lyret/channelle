import type { AdminSession } from "../lib";
import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { z } from "zod";
import { Peer, peerEmitter } from "../models/Peer";
import { getGlobalBackstageConfiguration } from "../_globalBackstageData";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure, middleware } = trpc();

/** In-memory online peer session storage */
export const onlineSessions: Record<string, Peer> = {};

/** In-memory authenticated admin session storage */
export const _adminSessions: Record<string, AdminSession> = {};

/** Session expiration time: 8 hours in milliseconds */
const SESSION_EXPIRATION_TIME = 8 * 60 * 60 * 1000;

/** Marks a known user as online */
export async function authenticate(peerId: string, givenPeer?: Peer): Promise<void> {
	if (!onlineSessions[peerId]) {
		const peer = givenPeer || (await Peer.findByPk(peerId));
		onlineSessions[peerId] = peer;
		peerEmitter.emit("onlineStatusChanged", peer);
		console.log(`[Auth] Login successful for peer ${peerId}. Active sessions: ${Object.keys(onlineSessions).length}`);
	}
	if (_adminSessions[peerId]) {
		_adminSessions[peerId].lastSeenTs = Date.now();
	}
}
/** Marks a known user as offline */
export function deauthenticate(peerId: string): void {
	if (!onlineSessions[peerId]) {
		return;
	} else {
		const peer = onlineSessions[peerId];
		delete onlineSessions[peerId];
		peerEmitter.emit("onlineStatusChanged", peer);
		console.log(`[Auth] Logout successful for peer ${peerId}. Active sessions: ${Object.keys(onlineSessions).length}`);
	}
}

/**
 * Peer Authentication procedure middleware
 * Only allows identified peers to continue and retrive their details from the database
 * and passes it along with the context
 */
export const withAuthenticatedPeerMiddleware = middleware(async ({ ctx, next }) => {
	if (!ctx.peer?.id) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "No peer id given in request" });
	}

	const peer = onlineSessions[ctx.peer.id];

	if (!peer) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "The given peer is not online, please authenticate" });
	}

	// Update peer online status
	authenticate(ctx.peer.id);

	return next({ ctx: { peer } });
});

/**
 * Authenticated Peer Procedure
 * Only allows identified users to continue and keeps their online status updated
 */
export const authenticatedPeerProcedure = procedure.use(withAuthenticatedPeerMiddleware);

/**
 * Admin Authentication procedure middleware
 * Only allows signed in admin users to continue
 */
export const withAuthenticatedAdminMiddleware = middleware(({ ctx, next }) => {
	// When in stage mode all connected managers have admin access
	if (!CONFIG.runtime.theater) {
		if (!ctx.peer.manager) {
			throw new TRPCError({ code: "UNAUTHORIZED", message: "Only managers are allowed to perform this action" });
		}
		return next({ ctx });
	}

	// Find out if the connection is authenticated
	_cleanupExpiredAdminSessions();
	const session = _adminSessions[ctx.peer.id];
	if (!session) {
		throw new TRPCError({ code: "UNAUTHORIZED", message: "Only authenticated admins are allowed to perform this action" });
	}

	// Continue, and make sure the peer in context is marked as a manager
	ctx.peer.manager = true;
	return next({ ctx });
});

/**
 * Authentication procedure
 * Only allows signed in admin users to continue
 */
export const authenticatedAdminProcedure = authenticatedPeerProcedure.use(withAuthenticatedAdminMiddleware);

/**
 * Authentication Router - Handles secure theater authentication with session management
 */
export const authRouter = trcpRouter({
	/**
	 * Authenticate with theater password and create a session
	 */
	authenticate: procedure
		.input(
			z.object({
				name: z.string(),
				teatherPassword: z.string().optional(),
				showId: z.number().int().gte(0).nullable().optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Refresh an already existing session
			if (_adminSessions[ctx.peer.id]) {
				_adminSessions[ctx.peer.id].lastSeenTs = Date.now();
			}

			// Check if the peer exists in the database and create a new one if not
			let peer = await Peer.findByPk(ctx.peer.id);
			if (!peer) {
				try {
					// Determine the current show id
					// Admin peers authenticated with theater password get showId -1 (all shows)
					let showId: number | null;
					if (CONFIG.runtime.theater) {
						if (input.teatherPassword && input.teatherPassword === CONFIG.theater.password) {
							showId = -1; // Admin peer belongs to all shows
						} else {
							showId = input.showId;
							if (!showId) {
								throw new Error("No show id given");
							}
						}
					} else {
						showId = getGlobalBackstageConfiguration().showId;
					}

					peer = await Peer.create({
						id: ctx.peer.id,
						name: input.name || (CONFIG.runtime.theater ? "Admin " + ctx.peer.id : ""),
						showId: showId,
						actor: false,
						manager: !CONFIG.runtime.production || CONFIG.runtime.debug, // When developing, all new peers become managers
						banned: false,
						audioMuted: false,
						videoMuted: false,
					});
				} catch (error) {
					console.error(`[Auth] Failed to create a new peer ${ctx.peer.id}: ${error.message}`);
				}
				console.log("[Auth]", ctx.peer.id, "joined as new peer");
			}

			// Verify given password, needed in theater mode to become an admin
			if (CONFIG.runtime.theater) {
				if (input.teatherPassword && input.teatherPassword !== CONFIG.theater.password) {
					console.log(`[Auth] Admin Authentication failed for peer ${ctx.peer.id}: Invalid theater password`);
					return {
						valid: false,
						message: "Invalid theater password",
					};
				}

				// Become an admin
				_adminSessions[peer.id] = {
					peerId: peer.id,
					joinTs: Date.now(),
					lastSeenTs: Date.now(),
				};
			}

			// Authenticate
			authenticate(ctx.peer.id, peer);

			return {
				success: true,
			};
		}),

	/**
	 * Validate that the given admin authentication is valid
	 */
	validateAdminAuthentication: procedure.query(async ({ ctx }) => {
		_cleanupExpiredAdminSessions();
		const session = _adminSessions[ctx.peer.id];
		if (!session) {
			console.log(`[Auth] Admin validation failed for peer ${ctx.peer.id}: Invalid or expired session`);
			return {
				valid: false,
				message: "Invalid or expired admin session",
			};
		}

		_adminSessions[ctx.peer.id].lastSeenTs = Date.now();
		return {
			valid: true,
		};
	}),

	/**
	 * Invalidate (logout) all sessions and go offline
	 */
	deauthenticate: procedure.mutation(async ({ ctx }) => {
		if (!onlineSessions[ctx.peer.id]) {
			return {
				valid: false,
				message: "Session not found",
			};
		}

		deauthenticate(ctx.peer.id);

		return {
			valid: false,
		};
	}),
});

/** Authentication Router Type */
export type AuthRouter = typeof authRouter;

/**
 * Utility function that cleans up all expired user sessions
 */
function _cleanupExpiredAdminSessions(): void {
	const now = Date.now();
	for (const [peerId, session] of Object.entries(_adminSessions)) {
		if (session.lastSeenTs + SESSION_EXPIRATION_TIME <= now) {
			delete _adminSessions[peerId];
		}
	}
}
