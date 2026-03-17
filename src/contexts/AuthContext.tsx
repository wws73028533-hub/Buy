import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { apiGet, apiPost } from '../lib/api'
import { AuthContext } from './AuthContextObject'
import type { AppSession, AuthContextValue } from './auth'

type SessionResponse = {
  session: AppSession | null
  usingDefaultAdmin: boolean
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AppSession | null>(null)
  const [usingDefaultAdmin, setUsingDefaultAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const data = await apiGet<SessionResponse>('/api/auth/session')

        if (!active) {
          return
        }

        setSession(data.session)
        setUsingDefaultAdmin(data.usingDefaultAdmin)
      } catch {
        if (!active) {
          return
        }

        setSession(null)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const data = await apiPost<SessionResponse>('/api/auth/login', { email, password })
    setSession(data.session)
    setUsingDefaultAdmin(data.usingDefaultAdmin)
  }, [])

  const signOut = useCallback(async () => {
    await apiPost<{ ok: true }>('/api/auth/logout')
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      usingDefaultAdmin,
      signIn,
      signOut,
    }),
    [loading, session, signIn, signOut, usingDefaultAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
