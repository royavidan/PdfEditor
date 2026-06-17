import React, { useState, createContext } from 'react'
import type { ContextProvider } from '../types'

const initialScale = 1 // = 100%

export interface ViewportContext {
  scale: number
  setScale: React.Dispatch<React.SetStateAction<number>>
  resetScale(): void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ViewportContext = createContext({} as ViewportContext)

const ViewportProvider: ContextProvider = ({ children }) => {
  const [scale, setScale] = useState(initialScale)
  const resetScale = () => setScale(initialScale)

  return (
    <ViewportContext.Provider
      value={{ scale, setScale, resetScale }}
    >
      {children}
    </ViewportContext.Provider>
  )
}

export default ViewportProvider