import { createContext } from 'react'

import type { AuthContextValue } from './auth'

export const AuthContext = createContext<AuthContextValue | null>(null)
