import type {
	RepositoryName,
	RepositoryTypes,
	RepositoryOperationTypes,
} from '~/api';
import { RepositorySubscription } from '~/api';
import type { Readable } from 'svelte/store';
import { readable, derived } from 'svelte/store';

/** Store interface */
interface DatabaseStore<T> {
	subscribe: (subscription: (value: T) => void) => () => void;
}

/** Creates a readable Svelte Store for all entries in the given repository */
export function createDatabaseStore<Name extends RepositoryName>(
	name: Name,
	id?: undefined
): DatabaseStore<RepositoryOperationTypes<Name, 'findMany'>['Result']>;

/** Creates a readable Svelte Store for a specific entry in the given repository */
export function createDatabaseStore<Name extends RepositoryName>(
	name: Name,
	id?: RepositoryTypes[Name]['ModelIdType']
): DatabaseStore<RepositoryOperationTypes<Name, 'findFirst'>['Result']>;

// Function implementation
export function createDatabaseStore<
	Name extends RepositoryName,
	IdType extends RepositoryTypes[Name]['ModelIdType'] | undefined,
>(
	repository: Name,
	id?: IdType
): DatabaseStore<
	IdType extends RepositoryTypes[Name]['ModelIdType']
		? RepositoryOperationTypes<Name, 'findFirst' | 'findMany'>['Result']
		: RepositoryOperationTypes<Name, 'findMany'>['Result']
> {
	const subscription = new RepositorySubscription<Name>({
		repository,
		id,
	});

	const { subscribe } = readable(subscription.data, function start(set) {
		// Load any existing data
		set(subscription.data);

		// Start the subscription
		subscription.on('data', (value) => {
			set(value);
		});
		subscription.start();

		return function stop() {
			subscription.stop();
		};
	});

	return {
		subscribe: subscribe,
	};
}

/** Creates a readable Svelte Store for a single entry that auto updates following another store for the id */
export function createDerivedDataStore<Name extends RepositoryName>(
	idStore: Readable<RepositoryTypes[Name]['ModelIdType'] | undefined>,
	repository: Name
): Readable<RepositoryOperationTypes<Name, 'findFirst'>['Result'] | null> {
	return derived(idStore, ($id, set) => {
		if (!$id) {
			set(null);
			return function stopOrUpdate() {};
		} else {
			const subscription = new RepositorySubscription<Name, 'first'>({
				repository,
				id: $id,
			});

			// Load any existing data
			set(subscription.data);

			// Start the subscription
			subscription.on('data', (value) => {
				set(value);
			});
			subscription.start();

			return function stopOrUpdate() {
				subscription.stop();
			};
		}
	});
}
