import type { Peer } from "../_types";
import { TRPCError } from "@trpc/server";
import { trpc } from "../lib";
import { z } from "zod";

// Get the trpc router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

/** In-memory user session storage */
const _users: Record<string, Peer> = {};

/**
 * User connection procedure
 * Only allows identified users to continue and keeps their online status updated
 */
export const userConnectionProcedure = trcpProcedure.use(async ({ ctx, next }) => {
	if (!ctx.peer?.id) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "No peer id given in request" });
	} else if (CONFIG.runtime.theater) {
		// In theather mode we don't need to join as a user, we are assumed to be a connected manager
		return next({ ctx: { peer: { ...ctx.peer, manager: true, online: true } } });
	} else if (!_users[ctx.peer.id]) {
		throw new TRPCError({ code: "BAD_REQUEST", message: "The given peer is not a registered user, please authenticate" });
	} else {
		_users[ctx.peer.id].online = true;
	}
	return next({ ctx: { peer: _users[ctx.peer.id] } });
});

/** Returns all known users */
export function getUsers(): Record<string, Peer> {
	return _users;
}

/** Creates a user entry for the given peerid */
export function join(peerId: string, name: string = ""): void {
	_users[peerId] = {
		id: peerId,
		name: name,
		actor: !CONFIG.runtime.production, // When developing, all new peers become actors
		manager: Object.keys(_users).length === 0, // The first peer is always a manager
		banned: false,
		// Inherit any previous properties if re-joining
		...(_users[peerId] || {}),
		// Update current status
		online: true,
		audioMuted: false,
		videoMuted: false,
	};

	console.log("[Users]", peerId, "joined as new peer");
}

/** Marks a known user as offline */
export function leave(peerId: string): void {
	if (_users[peerId]) {
		_users[peerId].online = false;
	}
	console.log("[Users] Peer", peerId, "left");
}

/**
 * User Router - Handles peer connections to the stage and their user status
 */
export const userRouter = trcpRouter({
	// Authenticate as a user
	join: trcpProcedure.input(z.object({ name: z.string().nonempty() })).mutation(async ({ input, ctx }) => {
		if (!ctx.peer?.id) {
			throw new TRPCError({ code: "BAD_REQUEST", message: "No peer information given" });
		}

		join(ctx.peer.id, input.name);
	}),
	// Deauthenticate as a user
	leave: userConnectionProcedure.mutation(async ({ ctx }) => {
		leave(ctx.peer.id);
	}),
	// Update user information
	update: userConnectionProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				actor: z.boolean().optional(),
				manager: z.boolean().optional(),
				banned: z.boolean().optional(),
			}),
		)
		.mutation(async ({ ctx, input: { id, name, actor, manager, banned } }) => {
			const peer = _users[id];

			// Make sure that the peer in context is either the same as being updated or a manager
			if (!(ctx.peer.id == id || ctx.peer.manager)) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
			}

			// Find the peer
			if (!peer) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Peer with given id not found" });
			}

			// Update peer's name
			if (name !== undefined) {
				peer.name = name;
			}

			// Make sure that the peer in context is a manager
			if (!ctx.peer.manager) {
				return;
			}

			// Update peer's actor status
			if (actor !== undefined) {
				peer.actor = actor;
			}

			// Update peer's manager status
			if (manager !== undefined) {
				peer.manager = manager;
			}

			// Update peer's banned status
			if (banned !== undefined) {
				peer.banned = banned;
			}

			// Update the record of peers
			_users[id] = peer;

			return;
		}),
});

/** User Router Type */
export type UserRouter = typeof userRouter;
