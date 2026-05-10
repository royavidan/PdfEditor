import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'
import { promises as fs } from 'fs'
import path from 'path'

export const readJSONFile = async (i: number, prefix: string = '') => JSON.parse(await fs.readFile(path.join(__dirname, 'data', `${prefix}${i}.json`), 'utf-8'))
export const readPDFFile = async (i: number) => {
    const fileData = await fs.readFile(path.join(__dirname, 'data', `${i}.pdf`))
    const loadingTask = pdfjs.getDocument({ data: fileData.buffer })
    const pdfDocument = await loadingTask.promise
    return pdfDocument
}