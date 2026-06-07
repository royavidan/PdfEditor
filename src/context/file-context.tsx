import React, { useState, createContext } from 'react'

import type { ContextProvider } from '../types'

export type FileData = ArrayBuffer

export interface FileContext<T> {
  data: T | null
  name: string | null
  setData: React.Dispatch<React.SetStateAction<T | null>>
  setName: React.Dispatch<React.SetStateAction<string | null>>
  isFileLoaded: () => boolean
}

const NO_FILE_DATA = null
// eslint-disable-next-line react-refresh/only-export-components
export const FileContext = createContext({} as FileContext<FileData>)

const FileProvider: ContextProvider = ({ children }) => {
  const [data, setData] = useState<FileData | null>(NO_FILE_DATA)
  const [name, setName] = useState<string | null>(null)
  const isFileLoaded = () => data !== NO_FILE_DATA

  return (
    <FileContext.Provider value={{ data, setData, name, setName, isFileLoaded }}>
      {children}
    </FileContext.Provider>
  )
}

export default FileProvider