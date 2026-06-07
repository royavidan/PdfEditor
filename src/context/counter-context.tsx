import { useState, useContext, createContext } from 'react'
import { SettingsContext } from './settings-context'
import type { ContextProvider } from '../types'

export interface CounterContext {
  counter: number
  resetCounter(): void
  incrementCounter(i?: number): void
  decrementCounter(i?: number): void
}

// eslint-disable-next-line react-refresh/only-export-components
export const CounterContext = createContext({} as CounterContext)

const CounterProvider: ContextProvider = ({ children }) => {
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

export default CounterProvider