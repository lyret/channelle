import { url } from './url'
import { derived } from 'svelte/store'

/** Store interface */
interface SearchParamStore {
  subscribe: (subscription: (value: string | undefined) => void) => () => void
  set: (value: string | undefined) => void
}

/** Creates a <string> store from a search parameter in the url */
export function createSeachParamStore(key: string): SearchParamStore {
  const { subscribe } = derived(url, ($url) => {
    return $url.searchParams.get(key) || undefined
  })

  const set = (value: string | undefined) => {
    const searchParams = new URLSearchParams(window.location.search)

    if (typeof value === 'undefined') {
      searchParams.delete(key)
    } else {
      searchParams.set(key, value)
    }

    window.location.search = searchParams.toString()
  }

  return {
    subscribe,
    set,
  }
}
