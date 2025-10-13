import { tracked, TRPCError } from "@trpc/server";
import Emittery from "emittery";
import { z } from "zod";
import { trpc, sequelize } from "../lib";
import { Message } from "../models/Message";
import type { MessageAttributes } from "../models";

// Get the trcp router constructor and default procedure
const { router: trcpRouter, procedure: trcpProcedure } = trpc();

// Internal event emitter for message updates
const _messageEmitter = new Emittery<{
	newMessage: MessageAttributes;
	newPublicMessage: MessageAttributes;
	newBackstageMessage: MessageAttributes;
}>();

// Chat connection procedure
// Procedure that ensures the peer context exists
const chatProcedure = trcpProcedure.use(async ({ ctx, next }) => {
	if (!ctx.peer?.id) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "No peer information given",
		});
	}
	return next();
});

/**
 * Chat Router
 * Handles chat messages including backstage messages
 */
export const chatRouter = trcpRouter({
	// Subscribe to all messages
	messages: chatProcedure.subscription(async function* ({ ctx }) {
		// Yield initial messages
		const initialMessages = await _getInitialMessages();
		yield tracked("initial", initialMessages);

		// Listen for new messages
		for await (const message of _messageEmitter.events("newMessage")) {
			yield tracked(String(message.id), message);
		}
	}),

	// Subscribe to public messages only (backstage: false)
	publicMessages: chatProcedure.subscription(async function* ({ ctx }) {
		// Yield initial public messages
		const initialMessages = await _getInitialMessages({ backstage: false });
		yield tracked("initial", initialMessages);

		// Listen for new public messages
		for await (const message of _messageEmitter.events("newPublicMessage")) {
			yield tracked(String(message.id), message);
		}
	}),

	// Subscribe to backstage messages only
	backstageMessages: chatProcedure.subscription(async function* ({ ctx }) {
		// Yield initial backstage messages
		const initialMessages = await _getInitialMessages({ backstage: true });
		yield tracked("initial", initialMessages);

		// Listen for new backstage messages
		for await (const message of _messageEmitter.events("newBackstageMessage")) {
			yield tracked(String(message.id), message);
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
			});

			// Emit the new message
			await _emitMessage(message);
		}),

	// Delete a message (managers only)
	delete: chatProcedure
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

	// Emit to all messages channel
	_messageEmitter.emit("newMessage", messageData);

	// Emit to specific channels based on message type
	if (message.backstage) {
		_messageEmitter.emit("newBackstageMessage", messageData);
	} else {
		_messageEmitter.emit("newPublicMessage", messageData);
	}
}

/**
 * Utility function to get initial messages based on a filter, for when the user first subscribes to a chat
 */
async function _getInitialMessages(filter?: { backstage?: boolean }) {
	// Ensure database connection
	await sequelize();

	const whereClause = filter?.backstage !== undefined ? { backstage: filter.backstage } : {};

	const messages = await Message.findAll({
		where: whereClause,
		order: [["createdAt", "ASC"]],
	});

	return messages.map((msg) => msg.toJSON());
}
