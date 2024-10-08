import type { Socket } from 'socket.io-client';

/** Creates a websocket request on the given namespace with a single data object and returns the acknowledgement in a promise */
export async function rtcRequest<Result, Params extends Object = Object>(
	socket: Socket,
	event: string,
	params: Params
) {
	return new Promise<Result>((resolve, reject) => {
		socket
			.timeout(2000)
			.emit(
				event,
				params || {},
				(
					err: any,
					response: { ok: false; err?: any } | { ok: true; data: Result }
				) => {
					if (response?.ok) {
						resolve(response.data);
					} else {
						console.error(response?.err || err);
						reject(response?.err || err);
					}
				}
			);
	});
}
