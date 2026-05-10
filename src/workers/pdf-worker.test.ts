import { extractPDFPageData } from './pdf-worker'
import { readPDFFile, readJSONFile } from '../test-utils/utils'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'

const TESTS = 1

describe('PDF Worker', () => {
    const readPDF = async (i: number) => {
        const pdfDocument = await readPDFFile(i)
        const p: any[] = []
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i)
            const opList = await page.getOperatorList()
            const viewport = page.getViewport({ scale: 1 })
            const rotation = viewport.rotation * Math.PI / 180
            const textContent = await page.getTextContent()
            const data: any = extractPDFPageData(opList, rotation, viewport.height, textContent.items as TextItem[])
            for (const key in data.symbols) data.symbols[key] = data.symbols[key].length
            p.push(data.symbols)
        }
        return p
    }

    for (let i = 1; i <= TESTS; i++) {
        it.concurrent(`PDF Worker - symbols ${i}`, async () => {
            const [expected, actual] = await Promise.all([readJSONFile(i, 'symbols'), readPDF(i)])
            expect(actual).toEqual(expected)
        })
    }
})