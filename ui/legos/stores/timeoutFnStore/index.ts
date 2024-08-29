import { tryOnDestroy } from "$lib/shared";
import type { Fn, Stoppable } from "$lib/shared/utils/types";
import { writable } from "svelte/store";

export interface UseTimeoutFnOptions {
	/**
	 * Start the timer immediate after calling this function
	 *
	 * @default true
	 */
	immediate?: boolean;
}

/**
 * Wrapper for `setTimeout` with controls.
 *
 * @param cb
 * @param interval
 * @param options
 */
export function timeoutFnStore(
	fn: Fn,
	interval = 1000,
	options: UseTimeoutFnOptions = {}
): Stoppable & { changeDuration: (duration: number) => void } {
	const { immediate = true } = options;
	const { set, subscribe } = writable(false);

	let timerId: ReturnType<typeof setTimeout> | null = null;

	function stop() {
		if (timerId !== null) {
			clearTimeout(timerId);
			timerId = null;
		}
	}

	function start(...args: any) {
		stop();
		set(true);
		timerId = setTimeout(() => {
			set(false);
			timerId = null;
			fn(...args);
		}, interval);
	}

	function changeDuration(newDuration: number) {
		interval = newDuration;
	}

	if (immediate) {
		start();
	}

	tryOnDestroy(stop);

	return {
		isPending: { subscribe },
		stop,
		start,
		changeDuration,
	};
}
