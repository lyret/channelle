import { readable } from 'svelte/store';

/** Returns the current inner dimensions of the browser window */
function _getCurrentWindowDimenstions() {
	if (
		typeof window === 'object' &&
		'innerWidth' in window &&
		'innerHeight' in window
	) {
		return {
			width: window.innerWidth,
			height: window.innerHeight,
		};
	}

	return {
		width: 0,
		height: 0,
	};
}

/** Stores the inner browser window dimensions */
export function windowSizeStore() {
	return readable(_getCurrentWindowDimenstions(), (_set) => {
		function handler() {
			_set(_getCurrentWindowDimenstions());
		}

		window.addEventListener('resize', handler);

		return () => window.removeEventListener('resize', handler);
	});
}
