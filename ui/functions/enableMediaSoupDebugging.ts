import * as MediaSoup from 'mediasoup-client';
import { Config } from '../../shared/config';

/** Sets the debug level for MediaSoup, requires and makes and additional reload due to the import order of MediaSoup */
export function enableMediaSoupDebugging() {
	const enabled = !!Config.debug.verboseOutput;
	const previouslyEnabled = !!window.localStorage.getItem('debug');
	if (!enabled) {
		window.localStorage.removeItem('debug');
	} else {
		window.localStorage.setItem('debug', 'mediasoup-client:*');
	}

	if (previouslyEnabled != enabled) {
		console.log('[MS Client] reloading window...');
		window.location.reload();
	} else {
		console.log('[MS Client] media soup version', MediaSoup.version);
	}
}
