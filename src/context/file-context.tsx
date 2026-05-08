import React, { useState, createContext } from 'react'
import type { ContextProvider } from '../types'

export interface FileContext<T> {
  data: T | null
  setData: (data: T) => void
  isFileLoaded: () => boolean
}

const NO_FILE_DATA = null
export const initialState = { data: NO_FILE_DATA }
export const FileContext = createContext({
  data: NO_FILE_DATA,
  setData: () => {},
  isFileLoaded: () => false
} as FileContext<ArrayBuffer>)

export default (({ children }) => {
  const [data, setData] = useState<ArrayBuffer | null>(NO_FILE_DATA)
  console.log('[file-context] file data:', data)
  const isFileLoaded = () => data !== NO_FILE_DATA

  return (
    <FileContext.Provider value={{ data, setData, isFileLoaded }}>
      {children}
    </FileContext.Provider>
  )
}) as ContextProvider