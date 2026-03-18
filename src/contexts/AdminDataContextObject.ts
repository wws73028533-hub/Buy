import { createContext } from 'react'

import type { AdminDataContextValue } from './adminData'

export const AdminDataContext = createContext<AdminDataContextValue | null>(null)
