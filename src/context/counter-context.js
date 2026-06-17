import React, { useState, createContext, useContext } from 'react'
import { SettingsContext } from './settings-context'

export const CounterContext = createContext({
  getCounter: () => 0,
  resetCounter: () => {},
  incrementCounter: () => {},
  decrementCounter: () => {}
})

export default ({ children }) => {
  const { initialCounter } = useContext(SettingsContext)
  const [counter, setCounter] = useState(null)
  const getCounter = () => counter || initialCounter
  const resetCounter = () => setCounter(null)
  const incrementCounter = (i = 1) => setCounter(counter => (counter || initialCounter) + i)
  const decrementCounter = (i = 1) => setCounter(counter => (counter || initialCounter) - i)
  return (
    <CounterContext.Provider
      value={{ getCounter, resetCounter, incrementCounter, decrementCounter }}
    >
      {children}
    </CounterContext.Provider>
  )
}
