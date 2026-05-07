import React, { useState, createContext } from 'react'

export const CounterContext = createContext({
  counter: 0,
  initialCounter: 0,
  resetCounter: () => {},
  setInitialCounter: () => {},
  incrementCounter: () => {},
  decrementCounter: () => {}
})

export default ({ children }) => {
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
