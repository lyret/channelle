import type { PeerAttributes } from "../models";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { trpc } from "../lib";
import { Peer, peerEmitter } from "../models/Peer";
import { withConfigProcedure } from "./backstageRouter";
import { withAuthenticatedPeerMiddleware, onlineSessions } from "./authRouter";

// Get the trpc router constructor and default procedure
const { router, procedure } = trpc();

/**
 * Authenticated Peer Procedure
 * Only allows identified users to continue
 */
const authenticatedPeerProcedure = procedure.use(withAuthenticatedPeerMiddleware);

/**
 * Peers Router - Handles peer management and updates
 */
export const peersRouter = router({
	/** Subscription for all peers per show id (global in stage mode) with automatic updates */
	peers: withConfigProcedure.subscription(async function* ({
		ctx: { config },
	}): AsyncGenerator<{ event: "initial"; peers: Record<string, PeerAttributes & { online: boolean }> } | { event: "created"; peer: PeerAttributes & { online: boolean } } | { event: "updated"; peer: PeerAttributes & { online: boolean } }> {
		const peers = await Peer.findAll({
			where: {
				showId: config.showId,
			},
		});

		yield {
			event: "initial",
			peers: Object.fromEntries(peers.map((peer) => [peer.id, { ...(peer.toJSON() as PeerAttributes), online: !!onlineSessions[peer.id] }])),
		};

		for await (const [event, peer] of peerEmitter.anyEvent()) {
			if (peer.showId !== config.showId) {
				continue;
			}
			yield {
				event: event,
				peer: { ...peer.toJSON(), online: !!onlineSessions[peer.id] },
			};
		}
	}),

	/**
	 * Update peer information
	 * Allows updating name for self, and roles/status for managers
	 */
	updatePeer: authenticatedPeerProcedure
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
			// Make sure that the peer in context is either the same as being updated or a manager
			if (!(ctx.peer.id == id || ctx.peer.manager)) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
			}

			// Find the peer in database
			const peer = await Peer.findByPk(id);
			if (!peer) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Peer with given id not found" });
			}

			// Prepare update object
			const updates: any = {};

			// Update peer's name
			if (name !== undefined) {
				updates.name = name;
			}

			// Make sure that the peer in context is a manager for role updates
			if (ctx.peer.manager) {
				// Update peer's actor status
				if (actor !== undefined) {
					updates.actor = actor;
				}

				// Update peer's manager status
				if (manager !== undefined) {
					updates.manager = manager;
				}

				// Update peer's banned status
				if (banned !== undefined) {
					updates.banned = banned;
				}
			}

			// Update the peer in database
			const updatedPeer = await peer.update(updates);

			// Update the in-memory session storage if peer is online
			if (onlineSessions[peer.id]) {
				onlineSessions[peer.id] = peer;
			}

			return updatedPeer;
		}),
});

/** Peers Router Type */
export type PeersRouter = typeof peersRouter;
