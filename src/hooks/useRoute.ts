import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void): (() => void) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
export function useRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () =>
      new URLSearchParams(window.location.search).has('state') &&
      (new URLSearchParams(window.location.search).has('code') ||
        new URLSearchParams(window.location.search).has('error'))
        ? '/evidence'
        : window.location.hash.slice(1) || '/jobs',
    () => '/jobs',
  )
}
