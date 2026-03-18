import { useContext } from 'react'

import { AdminDataContext } from './AdminDataContextObject'

export function useAdminData() {
  const context = useContext(AdminDataContext)

  if (!context) {
    throw new Error('useAdminData 必须在 AdminDataProvider 内使用。')
  }

  return context
}
