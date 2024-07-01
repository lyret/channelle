import { writable, derived } from 'svelte/store';

let nonStoreValue: { [panel: string]: boolean } =
	localStorage
		.getItem('open-panes')
		?.split(';')
		.reduce((obj, val) => (val ? { [val]: true, ...obj } : obj), {}) || {};

const writableOpenPanels = writable<{ [panel: string]: boolean }>(
	nonStoreValue
);

function serializeOpenPanels() {
	const serializedValue = Object.keys(nonStoreValue).join(';');
	localStorage.setItem('open-panes', serializedValue);
}

export const openPanels = derived(
	[writableOpenPanels],
	([$writableOpenPanels]) => {
		return $writableOpenPanels;
	}
);

export function togglePanel(panel: string) {
	if (nonStoreValue[panel]) {
		delete nonStoreValue[panel];
	} else {
		nonStoreValue[panel] = true;
	}
	serializeOpenPanels();
	writableOpenPanels.set(nonStoreValue);
}
