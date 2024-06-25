import { createSubscription, RepositoryName, RepositoryTypes } from '~/api'
import { readable, derived, Readable } from 'svelte/store'

/** Store interface */
interface APIStore<T> {
  subscribe: (subscription: (value: T) => void) => () => void
}

/** Creates a readable Svelte Store for all documents in the given collection */
export function createAPIStore<Name extends RepositoryName>(
  name: Name,
  id?: undefined
): APIStore<RepositoryTypes[Name]['ModelProjectionType'] | undefined>

/** Creates a readable Svelte Store for a specific document in the given collection */
export function createAPIStore<Name extends RepositoryName>(
  name: Name,
  id?: RepositoryTypes[Name]['ModelIdType']
): APIStore<RepositoryTypes[Name]['ModelProjectionType'] | undefined>

// Function implementation
export function createAPIStore<Name extends RepositoryName>(
  name: Name,
  id?: RepositoryTypes[Name]['ModelIdType']
) {
  const subscription = createSubscription<Name>(name, id)

  const { subscribe } = readable<
    RepositoryTypes[Name]['ModelProjectionType'] | undefined
  >(subscription.get(), function start(set) {
    // Load any existing data
    set(subscription.get())

    // Start the subscription
    subscription.onData((value) => {
      set(value)
    })
    subscription.start()

    return function stop() {
      subscription.stop()
    }
  })

  return {
    subscribe: subscribe,
  }
}

/** Creates a readable Svelte Store for a single document that auto updates following another store for the id */
export function createDerivedAPIStore<Name extends RepositoryName>(
  idStore: Readable<RepositoryTypes[Name]['ModelIdType'] | undefined>,
  repository: Name
): Readable<RepositoryTypes[Name]['ModelProjectionType'] | undefined> {
  return derived(idStore, (id, set) => {
    id = id || ('ignore-me' as any)
    const subscription = createSubscription(repository, id)

    // Load any existing data
    set(subscription.get())

    // Start the subscription
    subscription.onData((value) => {
      set(value)
    })
    subscription.start()

    return function stopOrUpdate() {
      subscription.stop()
    }
  })
}
