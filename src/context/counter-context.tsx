import { useState, useContext, createContext } from 'react'
import { SettingsContext } from './settings-context'
import type { ContextProvider } from '../types'

export interface CounterContext {
  getCounter(): number
  resetCounter(): void
  incrementCounter(i?: number): void
  decrementCounter(i?: number): void
}

// eslint-disable-next-line react-refresh/only-export-components
export const CounterContext = createContext({} as CounterContext)

const CounterProvider: ContextProvider = ({ children }) => {
  const { initialCounter } = useContext(SettingsContext)
  const [counter, setCounter] = useState<number | null>(null)
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

export default CounterProvider