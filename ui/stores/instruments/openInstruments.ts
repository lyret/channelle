import { persisted } from "svelte-persisted-store";
import { get } from "svelte/store";

export type InstrumentName = "debug" | "chat" | "participants" | "scene-settings" | "media-library" | "access";

export const openInstruments = createOpenInstrumentsStore();

export const focusedInstrument = persisted<InstrumentName | undefined>("focused-instrument", undefined);

function createOpenInstrumentsStore() {
	const _innerStore = persisted<Partial<Record<InstrumentName, boolean>>>("open-instruments", {});
	return {
		toggle: (instrument: InstrumentName) => {
			const _value = get(_innerStore) || {};
			if (_value[instrument]) {
				delete _value[instrument];
			} else {
				_value[instrument] = true;
			}
			_innerStore.set(_value);
		},
		set: _innerStore.set,
		subscribe: _innerStore.subscribe,
	};
}
