import type {
	SingletonDocuments,
	SingletonName,
} from '../../shared/singeltons';
import { writable } from 'svelte/store';

/** Store interface */
interface SingletonStore<T> {
	subscribe: (subscription: (value: T) => void) => () => void;
	set: (value: T) => void;
	update: (updater: (value: T) => T) => void;
}

/** Creates a readable Svelte Store for all documents in the given collection */
export function createSingletonStore<
	Name extends SingletonName,
	Document extends SingletonDocuments[Name],
>(name: Name): SingletonStore<Document | undefined> {
	const endpoint = `/api/v1/${name}`;
	let value: Document | undefined = undefined;

	const { subscribe, set: setter } = writable<Document | undefined>(
		value,
		function start() {
			return function stop() {};
		}
	);

	// Fetch any existing data
	fetch(endpoint)
		.then((response) => response.text())
		.then((data) => JSON.parse(data))
		.then((data) => {
			value = data;
			setter(data);
		})
		.catch((err) =>
			console.error(
				`[${name.toUpperCase()}] ERROR READING DATA ON STARTUP:`,
				err
			)
		);

	// Methods

	const set = function (data: Document | undefined) {
		fetch(endpoint, { method: 'POST', body: JSON.stringify(data) })
			.then(() => {
				value = data;
				setter(data);
			})
			.catch((err) =>
				console.error(`[${name.toUpperCase()}] ERROR STORING DATA:`, err)
			);
	};

	const update = function (
		updater: (value: Document | undefined) => Document | undefined
	) {
		fetch(endpoint)
			.then((response) => response.text())
			.then((data) => JSON.parse(data))
			.then((data) => {
				value = data;
				setter(data);
				return data;
			})
			.then((data) => {
				updater(data);
				return data;
			})
			.then((data) => set(data))
			.catch((err) =>
				console.error(`[${name.toUpperCase()}] ERROR UPDATING DATA:`, err)
			);
	};

	return {
		subscribe,
		set,
		update,
	};
}
