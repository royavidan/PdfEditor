import React, { useState, createContext, useEffect, useContext } from 'react'
import * as pdfjs from 'pdfjs-dist'

import { FileContext } from './file-context'
import type { ContextProvider } from '../types'

export interface PageContext {
    pages: number
    currentPage: number
    setPage: React.Dispatch<React.SetStateAction<number>>
    nextPage(): void
    prevPage(): void
}

// eslint-disable-next-line react-refresh/only-export-components
export const PageContext = createContext({} as PageContext)

const PageProvider: ContextProvider = ({ children }) => {
    const [pages, setPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(0)
    const { data, isFileLoaded } = useContext(FileContext)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentPage(0)
        if (isFileLoaded()) {
            pdfjs.getDocument(data!.slice(0)).promise.then(pdfDoc => setPages(pdfDoc.numPages))
        } else {
            setPages(1)
        }
    }, [data, isFileLoaded])

    const nextPage = () => setCurrentPage(currentPage => Math.min(currentPage + 1, pages - 1))
    const prevPage = () => setCurrentPage(currentPage => Math.max(currentPage - 1, 0))

    return (
        <PageContext.Provider
            value={{ pages, currentPage, setPage: setCurrentPage, nextPage, prevPage }}
        >
            {children}
        </PageContext.Provider>
    )
}

export default PageProvider