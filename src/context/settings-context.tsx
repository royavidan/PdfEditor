import React, { useState, createContext } from 'react'
import type { ContextProvider } from '../types'

export interface SettingsContext {
  doubleBloonsOnTap: boolean
  setDoubleBloonsOnTap: React.Dispatch<React.SetStateAction<boolean>>
  fontSize: number
  setFontSize: React.Dispatch<React.SetStateAction<number>>
  initialCounter: number
  setInitialCounter: React.Dispatch<React.SetStateAction<number>>

  showSettings: boolean
  openSettings(): void
  closeSettings(): void
  resetSettings(): void
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext({} as SettingsContext)

const SettingsProvider: ContextProvider = ({ children }) => {
  const [doubleBloonsOnTap, setDoubleBloonsOnTap] = useState(true)
  const [fontSize, setFontSize] = useState(12)
  const [initialCounter, setInitialCounter] = useState(2)
  const [showSettings, setShowSettings] = useState(false)

  const openSettings = () => setShowSettings(true)
  const closeSettings = () => setShowSettings(false)
  const resetSettings = () => {
    setDoubleBloonsOnTap(true)
    setInitialCounter(2)
  }
  return (
    <SettingsContext.Provider
      value={{ doubleBloonsOnTap, setDoubleBloonsOnTap, fontSize, setFontSize, initialCounter, setInitialCounter, showSettings, openSettings, closeSettings, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export default SettingsProvider