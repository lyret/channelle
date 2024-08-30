import { defaultDocument } from '$lib/shared';
import { readable } from 'svelte/store';

function getInitialState() {
	if (defaultDocument?.fullscreenElement) {
		return true;
	}
	return false;
}

export function isInFullscreen() {
	return readable(getInitialState(), (set) => {
		const fullscreenEventHandler = (event: any) => {
			if (defaultDocument?.fullscreenElement) {
				set(true);
			} else {
				set(false);
			}
		};

		defaultDocument?.addEventListener(
			'fullscreenchange',
			fullscreenEventHandler
		);

		const unsub = () => {
			defaultDocument?.removeEventListener(
				'fullscreenchange',
				fullscreenEventHandler
			);
		};

		return unsub;
	});
}
