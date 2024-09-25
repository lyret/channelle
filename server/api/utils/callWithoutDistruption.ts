/** Returns an async version of the given function that will catch any errors thrown */
export const callWithoutDistruption = <T extends Array<any>, U>(
	fn: (...args: T) => U
) => {
	return async (
		...args: T
	): Promise<{ ok: true; result: U } | { ok: false; error: string }> => {
		try {
			const result = await fn(...args);
			return { ok: true, result };
		} catch (err) {
			return { ok: false, error: err.toString() };
		}
	};
};
