import { createSerializedLocalStorageStore } from '~/_localStorage';
import { createLocalStore } from '../_localStore';

export type InstrumentName =
	| 'debug'
	| 'chat'
	| 'participants'
	| 'scene-settings'
	| 'media-library'
	| 'access';

function createOpenInstrumentsStore() {
	const { set, get, subscribe } = createSerializedLocalStorageStore<
		Partial<Record<InstrumentName, boolean>>
	>('open-instruments', {
		serialize: (value) => {
			return value ? Object.keys(value).join(';') : '';
		},
		deserialize: (data) => {
			return (
				data
					?.split(';')
					.reduce((obj, val) => (val ? { [val]: true, ...obj } : obj), {}) || {}
			);
		},
	});
	return {
		toggle: (instrument: InstrumentName) => {
			const _value = get() || {};
			if (_value[instrument]) {
				delete _value[instrument];
			} else {
				_value[instrument] = true;
			}
			set(_value);
		},
		set,
		subscribe,
	};
}

export const openInstruments = createOpenInstrumentsStore();
export const focusedInstrument = createLocalStore<InstrumentName | undefined>(
	'focused-instrument',
	undefined
);
