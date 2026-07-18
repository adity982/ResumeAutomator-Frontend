import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

import { setTokenProvider } from '../api/client'
import { auth, provider } from '../firebase'
import type { AuthSession } from '../types'

const developmentSession: AuthSession = {
  uid: 'local-user',
  email: 'local@example.com',
  displayName: 'Local Developer',
  isDevelopment: true,
}

export function useAuth(): {
  user: AuthSession | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  configurationError: string | null
} {
  const [user, setUser] = useState<AuthSession | null>(import.meta.env.DEV && !auth ? developmentSession : null)
  const [loading, setLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth) {
      const devToken = (import.meta.env.VITE_DEV_AUTH_TOKEN as string | undefined) || 'dev:local-user:local@example.com'
      setTokenProvider(async () => (import.meta.env.DEV ? devToken : null))
      return undefined
    }
    const currentAuth = auth
    const unsubscribe = onAuthStateChanged(currentAuth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email || 'User',
          isDevelopment: false,
        })
        setTokenProvider(() => firebaseUser.getIdToken())
      } else {
        setUser(null)
        setTokenProvider(async () => null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = useCallback(async () => {
    if (auth && provider) await signInWithPopup(auth, provider)
  }, [])

  const logout = useCallback(async () => {
    if (auth) await signOut(auth)
    setUser(import.meta.env.DEV && !auth ? developmentSession : null)
  }, [])

  return {
    user,
    loading,
    login,
    logout,
    configurationError: !import.meta.env.DEV && !auth ? 'Firebase is not configured. Add the VITE_FIREBASE_* environment variables.' : null,
  }
}
