import React, { useState, createContext, useEffect, useContext } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'

import { FileContext } from './file-context'
import type { ContextProvider } from '../types'

export interface PageContext {
    pages: number
    currentPage: number
    setPage: React.Dispatch<React.SetStateAction<number>>
    nextPage(): void
    prevPage(): void
}

export const PageContext = createContext({
    pages: 1,
    currentPage: 0,
    setPage: page => {},
    nextPage: () => {},
    prevPage: () => {}
} as PageContext)

export default (({ children }) => {
    const [pages, setPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(0)
    const { data, isFileLoaded } = useContext(FileContext)
    useEffect(() => {
        setCurrentPage(0)
        if (isFileLoaded()) {
            pdfjs.getDocument(data!).promise.then(pdfDoc => {
                setPages(pdfDoc.numPages)
            })
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
}) as ContextProvider