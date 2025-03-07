/** Returns an async version of the given function that will catch any errors thrown */
export const attempt = <Args extends Array<any>, Res>(
	fn: (...args: Args) => Res
) => {
	return async (
		...args: Args
	): Promise<{ ok: true; result: Res } | { ok: false; error: any }> => {
		try {
			const result = await fn(...args);
			return { ok: true, result };
		} catch (err) {
			console.error("attempt failed", err);
			return { ok: false, error: err };
		}
	};
};
