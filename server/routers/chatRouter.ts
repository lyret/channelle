import { tracked, TRPCError } from "@trpc/server";
import Emittery from "emittery";
import { z } from "zod";
import { trpc, sequelize } from "../lib";
import { Message } from "../models/Message";
import type { MessageAttributes } from "../models";
import { Show } from "../models/Show";
import { withAuthenticatedPeerMiddleware } from "./authRouter";

// Get the trcp router constructor and default procedure
const { router, procedure } = trpc();

// Internal event emitter for message updates
// Uses showId as event name (0 for stage mode)
const _messageEmitter = new Emittery<{
	[id: number]: MessageAttributes;
}>();

// Chat connection procedure
// Procedure that ensures the peer context exists and handles showId
const chatProcedure = procedure
	.input(
		z
			.object({
				showId: z.number().int().gte(0).nullable().optional(),
			})
			.optional(),
	)
	.use(async ({ ctx, input, next }) => {
		if (!ctx.peer?.id) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "No peer information given",
			});
		}

		// In theater mode, validate showId exists
		let validatedShowId: number | null = null;
		if (CONFIG.runtime.theater) {
			if (!input?.showId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Show ID is required in theater mode",
				});
			}
			// Verify the show exists
			const show = await Show.findByPk(input.showId);
			if (!show) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Selected show not found",
				});
			}
			validatedShowId = input.showId;
		}
		// In stage mode, showId is always null

		return next({
			ctx: {
				...ctx,
				showId: validatedShowId,
			},
		});
	});

/**
 * Chat Router
 * Handles chat messages including backstage messages
 */
export const chatRouter = router({
	// Subscribe to all messages
	messages: chatProcedure.subscription(async function* ({ ctx }) {
		// Yield initial messages
		const initialMessages = await _getInitialMessages(ctx.showId);
		yield tracked("initial", initialMessages);

		// Listen for new messages on the showId channel
		const eventKey = ctx.showId || 0;
		for await (const message of _messageEmitter.events(eventKey)) {
			// Additional filter by message type (all messages)
			yield tracked(String(message.id), message);
		}
	}),

	// Subscribe to public messages only (backstage: false)
	publicMessages: chatProcedure.subscription(async function* ({ ctx }) {
		// Yield initial public messages
		const initialMessages = await _getInitialMessages(ctx.showId, { backstage: false });
		yield tracked("initial", initialMessages);

		// Listen for new messages on the showId channel
		const eventKey = ctx.showId || 0;
		for await (const message of _messageEmitter.events(eventKey)) {
			// Filter by message type (public only)
			if (!message.backstage) {
				yield tracked(String(message.id), message);
			}
		}
	}),

	// Subscribe to backstage messages only
	backstageMessages: chatProcedure.subscription(async function* ({ ctx }) {
		// Yield initial backstage messages
		const initialMessages = await _getInitialMessages(ctx.showId, { backstage: true });
		yield tracked("initial", initialMessages);

		// Listen for new messages on the showId channel
		const eventKey = ctx.showId || 0;
		for await (const message of _messageEmitter.events(eventKey)) {
			// Filter by message type (backstage only)
			if (message.backstage) {
				yield tracked(String(message.id), message);
			}
		}
	}),

	// Send a message
	send: chatProcedure
		.input(
			z.object({
				message: z.string().min(1),
				peerName: z.string().optional(),
				backstage: z.boolean().optional().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Create the message
			const message = await Message.create({
				message: input.message,
				backstage: input.backstage,
				peerId: ctx.peer.id,
				peerName: input.peerName || ctx.peer?.name || "?",
				showId: ctx.showId,
			});

			// Emit the new message
			await _emitMessage(message);
		}),

	// Delete a message (managers only)
	delete: chatProcedure
		.use(withAuthenticatedPeerMiddleware)
		.input(
			z.object({
				messageId: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if peer is a manager
			if (!ctx.peer.manager) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Only managers can delete messages",
				});
			}

			const message = await Message.findByPk(input.messageId);
			if (!message) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			}

			await message.destroy();
		}),
});

/** Chat Router Type Definition */
export type ChatRouter = typeof chatRouter;

/**
 * Utility function to emit message events to the router
 */
async function _emitMessage(message: Message) {
	const messageData = message.toJSON() as MessageAttributes;

	// Emit to the showId channel (0 for stage mode)
	const eventKey = message.showId || 0;
	_messageEmitter.emit(eventKey, messageData);
}

/**
 * Utility function to get initial messages based on a filter, for when the user first subscribes to a chat
 */
async function _getInitialMessages(showId: number | null | undefined, filter?: { backstage?: boolean }) {
	// Ensure database connection
	await sequelize();

	const whereClause: any = {};

	// Add showId filter
	if (showId !== undefined) {
		whereClause.showId = showId;
	}

	// Add backstage filter if provided
	if (filter?.backstage !== undefined) {
		whereClause.backstage = filter.backstage;
	}

	const messages = await Message.findAll({
		where: whereClause,
		order: [["createdAt", "ASC"]],
	});

	return messages.map((msg) => msg.toJSON());
}
