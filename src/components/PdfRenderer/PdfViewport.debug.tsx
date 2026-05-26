import { useContext, useEffect } from 'react'
import OriginalPdfViewport from './PdfViewport'
import { FileContext } from '../../context/file-context'
import { PDFContext, type SymbolType } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'
import { ModificationContext } from '../../context/modification-context'

import styles from './PdfViewport.debug.module.scss'

const colors: Record<SymbolType, string> = {
  dia: 'red',
  depth: 'yellow',

  straightness: 'blue',
  flatness: 'green',
  circlarity: 'purple',
  cylindricity: 'brown',
  'surface profile': 'pink',
  perpendicularity: 'sand',
  angularity: 'gray',
  parallelism: 'aqua',
  symmetry: 'turquoise',
  'true position': 'chocolate',
  concentricity: 'violet',
  'run out': 'cyan'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global: any = globalThis

global.debugEnabled = true

const PdfViewport: typeof OriginalPdfViewport = props => {
    const { getText, getSymbols, getLoadedPages } = useContext(PDFContext)
    const { currentPage } = useContext(PageContext)
    const { isFileLoaded } = useContext(FileContext)
    const { modList } = useContext(ModificationContext)

    useEffect(() => {
        global.text = getText(currentPage)
        global.symbols = getSymbols(currentPage)
        global.modList = modList
    }, [currentPage, getText, getSymbols, modList])

    const isLoaded = isFileLoaded() && getLoadedPages() > currentPage
    const text = getText(currentPage)!, symbols = getSymbols(currentPage)!

    const cover = isLoaded ? <div className='debug'>
        {text.map((t, i) => <div key={`text-${i}`} className={styles.cover} style={{
            width: `${t.width}px`,
            height: `${t.height}px`,
            transform: `translate(${t.left}px, ${t.top}px) rotate(${t.angle}rad)`,
            borderColor: 'black',
            borderRadius: t.plusminus ? '25%' : '0'
        }}/>)}
        {Object.entries(symbols).map(([symbolType, symbols]) => symbols.map((s, i) => <div key={`symbol-${symbolType}-${i}`} className={styles.cover} style={{
            width: `${s.width}px`,
            height: `${s.height}px`,
            transform: `translate(${s.left}px, ${s.top}px)`,
            borderColor: colors[symbolType as SymbolType]
        }}/>).flat())}
    </div> : null

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'c' && e.ctrlKey) {
                navigator.clipboard.writeText(JSON.stringify({ text: global.text, symbols: global.symbols }, null, 4))
                console.log('Copied data')
            }
            else if (e.key === 'c' && e.altKey) {
                navigator.clipboard.writeText(JSON.stringify(modList, null, 4))
                console.log('Copied mod list')
            }
        }
        document.body.addEventListener('keydown', handler)
        return () => document.body.removeEventListener('keydown', handler)
    }, [modList])

    return <OriginalPdfViewport {...props} children={cover}/>
}

export default PdfViewport