import type * as IO from "socket.io";

/** Creates a request handler for an event on given web socket connection, made to match the client side rtcRequest function */
export function createRTCResponseHandler<
	Result,
	Params extends object = object,
>(
	event: string,
	handler: (params: Params, socket: IO.Socket) => Promise<Result>
): (socket: IO.Socket) => () => void {
	return function startListening(socket) {
		// Wrap the given handler with return object and error handling
		const wrappedHandler = async (params, callback) => {
			try {
				console.log(`(ws:${socket.nsp.name}-${event}) Request`, {
					params,
					id: socket.id,
				});
				const data = await handler(params, socket);
				callback({ ok: true, data });
			} catch (err) {
				console.error(`(ws:${socket.nsp.name}-${event}) Failed`, {
					id: socket.id,
				});
				console.error(err);

				callback({
					ok: false,
					err: CONFIG.isProduction ? err : "Server Error",
				});
			}
		};

		// Start listening for events
		socket.on(event, wrappedHandler);

		// Return stop function
		return function stopListening() {
			socket.off(event, wrappedHandler);
		};
	};
}
