import * as pdfjs from 'pdfjs-dist'
import { promises as fs } from 'fs'
import path from 'path'

export const readPlainFile = async (file: string) => (await fs.readFile(path.join(__dirname, 'data', file))).buffer
export const readJSONFile = async (i: number, name: string) => JSON.parse(await fs.readFile(path.join(__dirname, 'data', `test${i}`, `${name}.json`), 'utf-8'))
export const readPDFFile = async (i: number) => {
    const fileData = await fs.readFile(path.join(__dirname, 'data', `test${i}`, `doc.pdf`))
    const loadingTask = pdfjs.getDocument({ data: fileData.buffer })
    const pdfDocument = await loadingTask.promise
    return pdfDocument
}