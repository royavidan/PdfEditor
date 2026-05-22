import React, { useState, createContext } from 'react'
import type { ContextProvider } from '../types'

export interface CounterContext {
  counter: number
  initialCounter: number
  resetCounter(): void
  setInitialCounter: React.Dispatch<React.SetStateAction<number>>
  incrementCounter: (i?: number) => void
  decrementCounter: (i?: number) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const CounterContext = createContext({} as CounterContext)

const CounterProvider: ContextProvider = ({ children }) => {
  const [initialCounter, setInitialCounter] = useState(2)
  const [counter, setCounter] = useState(initialCounter)
  const resetCounter = () => setCounter(initialCounter)
  const incrementCounter = (i = 1) => setCounter(counter => counter + i)
  const decrementCounter = (i = 1) => setCounter(counter => counter - i)
  return (
    <CounterContext.Provider
      value={{ counter, initialCounter, resetCounter, setInitialCounter, incrementCounter, decrementCounter }}
    >
      {children}
    </CounterContext.Provider>
  )
}

export default CounterProvider