import { extractPDFPageData } from './pdf-worker'
import { isInside } from '../utils'
import { readPDFFile, readJSONFile } from '../test-utils/utils'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import type { Modification } from '../context/modification-context'

const TESTS = 1

type SymbolTable = Record<string, number>

describe('PDF Worker', () => {
    const readPDF = async (i: number) => {
        const modList: Modification[] = await readJSONFile(i, 'modList')
        const pdfDocument = await readPDFFile(i)
        const p: SymbolTable[] = []
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i)
            const opList = await page.getOperatorList()
            const viewport = page.getViewport({ scale: 1 })
            const rotation = viewport.rotation * Math.PI / 180
            const textContent = await page.getTextContent()
            const data = extractPDFPageData(opList, rotation, viewport.height, textContent.items as TextItem[])
            p.push(Object.fromEntries(Object.entries(data.symbols).map(e => [e[0], e[1].filter(symbol => 
                modList.some(mod => mod.page === i - 1 && isInside(symbol, mod.bloon))
            ).length])))
        }
        return p
    }

    for (let i = 1; i <= TESTS; i++) {
        it.concurrent(`PDF Worker - symbols ${i}`, async () => {
            const [expected, actual] = await Promise.all([readJSONFile(i, 'symbols') as Promise<SymbolTable[]>, readPDF(i)])
            expect(actual).toEqual(expected)
        })
    }
})