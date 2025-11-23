import * as React from 'react'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const ScanContext = React.createContext<{ rescan: () => void }>({ rescan: () => {} })

export const ScanProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, rescan] = React.useReducer(() => [], [])

  const value = React.useMemo(
    () => ({ rescan }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )
  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>
}