import React, { useState, useEffect, createContext, useContext } from 'react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'
import { PDFDocument } from 'pdf-lib'
//eslint-disable-next-line import/no-webpack-loader-syntax
import PDFWorker from 'worker-loader!../workers/pdf-worker.ts'

import { FileContext, FileData } from './file-context'
import type { ContextProvider, Border } from '../types'
import type { WorkerType, PdfWorkerData } from '../workers/pdf-worker'

export type Transform = [number, number, number, number, number, number]

export type SymbolType = 'dia' | 'depth' | 'straightness' | 'flatness' | 'circlarity' | 'cylindricity' | 'surface profile' | 'perpendicularity' | 'angularity' | 'parallelism' | 'symmetry' | 'true position' | 'concentricity' | 'run out'

export interface Symbol extends Border {
    width: number
    height: number
}

export interface Text extends Border {
    str: string
    width: number
    height: number
    transform: Transform
    angle: number
    border: Border
    plusminus?: boolean
}

export interface Data {
    text: Text[]
    symbols: Record<SymbolType, Symbol[]>
}

interface Info {
    size: { width: number, height: number }
    angle: number
}

async function extractPDFData(fileData: FileData, setData: React.Dispatch<React.SetStateAction<(Data | null)[]>>) {
    console.log('Loading PDF context')
    const loadingTask = pdfjs.getDocument({ data: fileData })
    const pdfDocument = await loadingTask.promise
    const p: PdfWorkerData[] = []
    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i)
        const opList = await page.getOperatorList()
        const viewport = page.getViewport({ scale: 1 })
        const rotation = viewport.rotation * Math.PI / 180
        const textContent = await page.getTextContent()
        p.push({ opList, rotation, pageHeight: viewport.height, textItems: textContent.items } as PdfWorkerData)
    }
    const worker = new PDFWorker() as WorkerType
    const promise = new Promise<void>((resolve, reject) => {
        let counter = 0
        worker.onmessage = e => {
            const result = e.data
            if (result.success) {
                setData(data => data[0] === null ? [result.data] : [...data, result.data])
            } else {
                alert('Error loading PDF context, try again...')
                worker.onmessage = () => { }
                setData([null])
                reject(result.error)
            }
            if (++counter === p.length) resolve()
        }
    })
    worker.postMessage(p)
    return await promise.finally(() => worker.terminate())
}

async function getDocumentInfo(data: FileData) {
    const pdfDoc = await PDFDocument.load(data)
    return pdfDoc.getPages().map(page => ({ size: page.getSize(), angle: page.getRotation().angle }))
}

export interface PDFContext {
    getText(page: number): Text[] | undefined
    getSymbols(page: number): Record<SymbolType, Symbol[]> | undefined
    getSize(page: number): { width: number, height: number }
    getAngle(page: number): number
    getLoadedPages(): number
}

export const PDFContext = createContext({
    getText: page => { },
    getSymbols: page => { },
    getSize: page => { },
    getAngle: page => { },
    getLoadedPages: () => 0
} as PDFContext)

export default (({ children }) => {
    const { data: fileData, isFileLoaded } = useContext(FileContext)
    const [data, setData] = useState<(Data | null)[]>([null])
    const [info, setInfo] = useState<(Info)[]>([{ size: { width: 0, height: 0 }, angle: 0 }])

    const getLoadedPages = () => info[0].size.width ? (data[0] === null ? 0 : data.length) : 0

    useEffect(() => {
        setData([null])
        setInfo([{ size: { width: 0, height: 0 }, angle: 0 }])
        if (isFileLoaded()) {
            extractPDFData(fileData!, setData)
            getDocumentInfo(fileData!).then(setInfo)
        }
    }, [fileData, isFileLoaded])

    const getText = (page: number) => data[page]?.text
    const getSymbols = (page: number) => data[page]?.symbols
    const getSize = (page: number) => info[page].size
    const getAngle = (page: number) => info[page].angle

    return (
        <PDFContext.Provider
            value={{ getText, getSymbols, getSize, getAngle, getLoadedPages }}
        >
            {children}
        </PDFContext.Provider>
    )
}) as ContextProvider
