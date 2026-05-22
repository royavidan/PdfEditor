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

    const insertCover = () => {
        if (!isLoaded || document.getElementsByClassName('debug').length > 0) return

        const canvas = document.getElementsByTagName('canvas')[0]
        const base = canvas.parentElement!
        document.body.addEventListener('keydown', e => {
            if (e.key === 'c' && e.ctrlKey) {
                navigator.clipboard.writeText(JSON.stringify({ text: global.text, symbols: global.symbols }, null, 4))
                console.log('Copied data')
            }
            else if (e.key === 'c' && e.altKey) {
                navigator.clipboard.writeText(JSON.stringify(modList, null, 4))
                console.log('Copied mod list')
            }
        })
        const node = document.createElement('div')
        for (const t of text) {
            const div = document.createElement('div')
            div.classList.add(styles.cover)
            div.style.width = `${t.width}px`
            div.style.height = `${t.height}px`
            div.style.transform = `translate(${t.left}px, ${t.top}px) rotate(${t.angle}rad)`
            div.style.borderColor = 'black'
            div.style.borderRadius = t.plusminus ? '25%' : '0'
            node.appendChild(div)
        }
        for (const n in symbols) {
            for (const s of symbols[n as SymbolType]) {
                const div = document.createElement('div')
                div.classList.add(styles.cover)
                div.style.width = `${s.width}px`
                div.style.height = `${s.height}px`
                div.style.transform = `translate(${s.left}px, ${s.top}px)`
                div.style.borderColor = colors[n as SymbolType]
                node.appendChild(div)
            }
        }
        node.className = 'debug cover'
        base.appendChild(node)
    }

    return <div ref={insertCover}><OriginalPdfViewport {...props} /></div>
}

export default PdfViewport