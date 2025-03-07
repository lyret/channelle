import type { Socket } from "socket.io-client";

/** Creates a function for sending a websocket request on the given namespace with a single data object and returns the acknowledgement in a promise */
export function createRtcRequest<Result, Params extends object = object>(
	event: string
): (socket: Socket, params: Params) => Promise<Result> {
	return async function rtcRequest(socket: Socket, params: Params) {
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
	};
}
