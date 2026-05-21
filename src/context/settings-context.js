import React, { useState, createContext } from 'react'

export const SettingsContext = createContext({
  doubleBloonsOnTap: true,
  setDoubleBloonsOnTap: () => {},
  fontSize: 0,
  setFontSize: () => {},
  initialCounter: 0,
  setInitialCounter: () => {},

  showSettings: false,
  openSettings: () => {},
  closeSettings: () => {},
  resetSettings: () => {}
})

export default ({ children }) => {
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
