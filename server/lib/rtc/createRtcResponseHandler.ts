import type * as IO from 'socket.io';

/** Creates a request handler for an event on given web socket connection, made to match the client side rtcRequest function */
export async function createRTCResponseHandler<Result, Params extends Object>(
	socket: IO.Socket,
	event: string,
	handler: (params: Params) => Promise<Result>
) {
	socket.on(event, async (params, callback) => {
		try {
			console.log(`(ws:${socket.nsp.name}-${event}) Request`, {
				params,
				id: socket.id,
			});
			const data = await handler(params);
			callback({ ok: true, data });
		} catch (err) {
			console.error(`(ws:${socket.nsp.name}-${event}) Failed`, {
				id: socket.id,
			});
			console.error(err);

			callback({
				ok: false,
				err: CONFIG.isProduction ? err : 'Server Error',
			});
		}
	});
}
