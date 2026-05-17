import React, { useContext, useEffect } from 'react'
import ReactDOM from 'react-dom'
import OriginalPdfViewport from './PdfViewport'
import { FileContext } from '../../context/file-context'
import { PDFContext, Text, Symbol } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'
import { ModificationContext } from '../../context/modification-context'
import type { SymbolType } from '../../context/pdf-context'

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

const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    background: 'transparent',
    border: '1px solid darkred',
    pointerEvents: 'none',
    opacity: 0.5,
    transformOrigin: 'bottom left'
}

const TextBox = ({ text }: { text: Text }) => {
    return <div style={{
        ...style,
        width: `${text.width}px`,
        height: `${text.height}px`,
        transform: `translate(${text.left}px, ${text.top}px) rotate(${text.angle}rad)`,
        borderColor: 'black',
        borderRadius: text.plusminus ? '25%' : 0
    }} />
}

const SymbolBox = ({ symbol, type }: { symbol: Symbol, type: SymbolType }) => {
    return <div title={'help'} style={{
        ...style,
        width: `${symbol.width}px`,
        height: `${symbol.height}px`,
        transform: `translate(${symbol.left}px, ${symbol.top}px)`,
        borderColor: colors[type]
    }} />
}

declare var global: any
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

    const insertCover = (ins: HTMLDivElement | null) => {
        if (!ins || !isLoaded) return
        
        const cover = <>
            {text.map((t, i) => <TextBox text={t} key={`text-${i}`}/>)}
            {Object.entries(symbols).map(([symbol, matches]) => matches.map((s, i) => <SymbolBox symbol={s} type={symbol as SymbolType} key={`symbol-${symbol}-${i}`} />)).flat()}
        </>

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
        node.className = 'debug cover'
        base.appendChild(node)

        ReactDOM.render(cover, node)
    }

    return <div ref={insertCover}><OriginalPdfViewport {...props} /></div>
}

PdfViewport.propTypes = OriginalPdfViewport.propTypes

export default PdfViewport