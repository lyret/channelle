import { ws } from '../api';

/** Creates a websocket request on the given namespace with a single data object and returns the acknowledgement in a promise */
export async function rtcRequest<Result, Params extends Object>(
	namespace: string = '/',
	event: string,
	params: Params
) {
	return new Promise<Result>((resolve, reject) => {
		console.log(`(ws:${namespace}-${event}) Request`, { params });
		ws(namespace)
			.timeout(2000)
			.emit(
				event,
				params || {},
				(response: { ok: false; err?: any } | { ok: true; data: Result }) => {
					if (response.ok) {
						resolve(response.data);
					} else {
						console.error(`(ws:${namespace}-${event}) Failed`);
						console.error(response.err);
						reject(response.err);
					}
				}
			);
	});
}
