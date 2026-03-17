import { useContext } from 'react'

import { AuthContext } from './AuthContextObject'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用。')
  }

  return context
}
