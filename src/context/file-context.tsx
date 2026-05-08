import React, { useState, createContext } from 'react'
import type { ContextProvider } from '../types'

export type FileData = ArrayBuffer

export interface FileContext<T> {
  data: T | null
  setData: React.Dispatch<React.SetStateAction<T | null>>
  isFileLoaded: () => boolean
}

const NO_FILE_DATA = null
export const initialState = { data: NO_FILE_DATA }
export const FileContext = createContext({
  data: NO_FILE_DATA,
  setData: () => {},
  isFileLoaded: () => false
} as FileContext<FileData>)

export default (({ children }) => {
  const [data, setData] = useState<FileData | null>(NO_FILE_DATA)
  console.log('[file-context] file data:', data)
  const isFileLoaded = () => data !== NO_FILE_DATA

  return (
    <FileContext.Provider value={{ data, setData, isFileLoaded }}>
      {children}
    </FileContext.Provider>
  )
}) as ContextProvider