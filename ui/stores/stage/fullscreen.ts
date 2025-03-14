import type { Writable } from "svelte/store";

export function fullscreenStore() : Omit<Writable<boolean>, "update"> & { toggle: () => void } {
	return {
		subscribe: (set) => {
			const fullscreenEventHandler = () => {
				if (document?.fullscreenElement) {
					set(true);
				} else {
					set(false);
				}
			};
	
			document?.addEventListener(
				"fullscreenchange",
				fullscreenEventHandler
			);
	
			return () => {
				document?.removeEventListener(
					"fullscreenchange",
					fullscreenEventHandler
				);
			};
		},
		toggle: () => {
			if (document?.fullscreenElement) {
				document.exitFullscreen();
			}
			else {
				document.body.requestFullscreen();
			}
		},
		set: (value : boolean) => {
			if (value) {
				document.body.requestFullscreen();
			}
			else {
				document.exitFullscreen();
			}
		}
	};
}
