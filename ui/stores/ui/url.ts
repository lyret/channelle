//@see https://bjornlu.com/blog/simple-svelte-routing-with-reactive-urls/

import { derived, writable, type Writable } from 'svelte/store';
import { router, type Route, defaultRoute } from './routes';
export type { Route } from './routes';
export { linkTo, gotoRoute, replaceRoute } from './routes';

// For server side rendering
const isBrowser = typeof window !== 'undefined';
const defaultUrl = 'https://example.com/';
const href = writable(isBrowser ? window.location.href : defaultUrl);
let Url: typeof URL;

if (!isBrowser) {
	//@ts-ignore
	Url = require('url').URL;
} else {
	Url = window.URL;
	const originalPushState = history.pushState;
	const originalReplaceState = history.replaceState;

	const updateHref = () => href.set(window.location.href);

	history.pushState = function () {
		//@ts-ignore
		originalPushState.apply(this, arguments);
		updateHref();
	};

	history.replaceState = function () {
		//@ts-ignore
		originalReplaceState.apply(this, arguments);
		updateHref();
	};

	window.addEventListener('popstate', updateHref);
	window.addEventListener('hashchange', updateHref);
}

// URL

export const url = {
	subscribe: derived(href, ($href) => new Url($href)).subscribe,
	//ssrSet: (urlHref) => href.set(urlHref),
};

// ROUTES

export const route = derived<
	Writable<string>,
	Route<{ [key: string]: string | undefined }>
>(href, ($href, set: (value: Route) => void) => {
	router
		.resolve(window.location)
		.then((results) => {
			console.log('[ROUTE]', results);
			set(results as Route);
		})
		.catch((err) => {
			set(defaultRoute as Route);
		});
});
