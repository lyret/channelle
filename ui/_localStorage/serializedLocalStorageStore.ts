import { writable } from 'svelte/store';

/** Creates a Svelte Store that syncs a value with local storage with the given serialization method */
export function createSerializedLocalStorageStore<V>(
	identifier: string,
	options: {
		serialize: (data: V | undefined) => string;
		deserialize: (data: string | null) => V;
	}
) {
	const _identifier = identifier;
	let _value = options.deserialize(localStorage.getItem(_identifier));

	const { subscribe, set } = writable<V>(_value, function start() {
		return function stop() {};
	});

	return {
		key: _identifier,
		get: () => {
			return _value;
		},
		set: (value: V) => {
			try {
				const serializedValue = options.serialize(value);
				_value = value;
				set(_value);
				if (serializedValue) {
					localStorage.setItem(_identifier, serializedValue);
				} else if (serializedValue) {
					localStorage.removeItem(_identifier);
				}
			} catch (err) {
				console.error(err);
			}
		},
		subscribe,
	};
}
