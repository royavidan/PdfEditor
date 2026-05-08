import React, { useState, createContext } from 'react'
import type { ContextProvider } from '../types'

const initialScale = 1 // = 100%
const initialFontSize = 12

export interface ViewportContext {
  scale: number
  setScale(scale: number): void
  resetScale(): void
  fontSize: number
  setFontSize(fontSize: number): void
}

export const ViewportContext = createContext({
  scale: initialScale,
  setScale: () => {},
  resetScale: () => {},
  fontSize: initialFontSize,
  setFontSize: () => {}
} as ViewportContext)

export default (({ children }) => {
  const [scale, setScale] = useState(initialScale)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const resetScale = () => setScale(initialScale)

  return (
    <ViewportContext.Provider
      value={{ scale, setScale, resetScale, fontSize, setFontSize }}
    >
      {children}
    </ViewportContext.Provider>
  )
}) as ContextProvider
