import {
  createSocketSubscription,
  RepositoryName,
  RepositoryTypes,
  RepositoryOperationTypes,
} from '~/api';
import { readable, derived, Readable } from 'svelte/store';

/** Store interface */
interface APIStore<T> {
  subscribe: (subscription: (value: T) => void) => () => void;
}

/** Creates a readable Svelte Store for all documents in the given collection */
export function createAPIStore<Name extends RepositoryName>(
  name: Name,
  id?: undefined,
  args?: RepositoryOperationTypes<Name, 'findFirst'>['Args']
): APIStore<RepositoryOperationTypes<Name, 'findMany'>['Result']>;

/** Creates a readable Svelte Store for a specific document in the given collection */
export function createAPIStore<Name extends RepositoryName>(
  name: Name,
  id?: RepositoryTypes[Name]['ModelIdType'],
  args?: RepositoryOperationTypes<Name, 'findMany'>['Args']
): APIStore<RepositoryOperationTypes<Name, 'findFirst'>['Result']>;

// Function implementation
export function createAPIStore<Name extends RepositoryName>(
  name: Name,
  id?: RepositoryTypes[Name]['ModelIdType'] | undefined,
  args?: RepositoryOperationTypes<Name, 'findFirst' | 'findMany'>['Args']
): APIStore<
  | RepositoryOperationTypes<Name, 'findFirst' | 'findMany'>['Result']
  | Array<RepositoryOperationTypes<Name, 'findMany'>['Result']>
> {
  const subscription = createSocketSubscription<Name>(name, id, args);

  const { subscribe } = readable(subscription.get(), function start(set) {
    // Load any existing data
    set(subscription.get());

    // Start the subscription
    subscription.onData((value) => {
      console.log('HERE ALSO', value);
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

/** Creates a readable Svelte Store for a single document that auto updates following another store for the id */
export function createDerivedAPIStore<Name extends RepositoryName>(
  idStore: Readable<RepositoryTypes[Name]['ModelIdType'] | undefined>,
  repository: Name
): Readable<RepositoryOperationTypes<Name, 'findFirst'>['Result']> {
  return derived(idStore, (id, set) => {
    id = id || ('ignore-me' as any);
    const subscription = createSocketSubscription(repository, id);

    // Load any existing data
    set(subscription.get());

    // Start the subscription
    subscription.onData((value) => {
      console.log('DDD', value);
      set(value);
    });
    subscription.start();

    return function stopOrUpdate() {
      subscription.stop();
    };
  });
}
