import React, { useState, createContext, useContext } from 'react'
import { SettingsContext } from './settings-context'

export const CounterContext = createContext({
  counter: 0,
  resetCounter: () => {},
  incrementCounter: () => {},
  decrementCounter: () => {}
})

export default ({ children }) => {
  const { initialCounter } = useContext(SettingsContext)
  const [counter, setCounter] = useState(initialCounter)
  const resetCounter = () => setCounter(initialCounter)
  const incrementCounter = (i = 1) => setCounter(counter => counter + i)
  const decrementCounter = (i = 1) => setCounter(counter => counter - i)
  return (
    <CounterContext.Provider
      value={{ counter, resetCounter, incrementCounter, decrementCounter }}
    >
      {children}
    </CounterContext.Provider>
  )
}
