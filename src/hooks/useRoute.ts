import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void): (() => void) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
export function useRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1) || '/jobs',
    () => '/jobs',
  )
}
