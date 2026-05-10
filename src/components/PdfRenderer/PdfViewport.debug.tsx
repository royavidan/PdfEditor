import React, { useContext } from 'react'
import ReactDOM from 'react-dom'
import OriginalPdfViewport from './PdfViewport'
import { FileContext } from '../../context/file-context'
import { PDFContext, Text, Symbol } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'

const colors: Record<string, string> = {
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

const SymbolBox = ({ symbol, type }: { symbol: Symbol, type: string }) => {
    return <div title={'help'} style={{
        ...style,
        width: `${symbol.width}px`,
        height: `${symbol.height}px`,
        transform: `translate(${symbol.left}px, ${symbol.top}px)`,
        borderColor: colors[type]
    }} />
}

const PdfViewport: typeof OriginalPdfViewport = props => {
    const { getText, getSymbols, getLoadedPages } = useContext(PDFContext)
    const { currentPage } = useContext(PageContext)
    const { isFileLoaded } = useContext(FileContext)

    const isLoaded = isFileLoaded() && getLoadedPages() > currentPage
    const text = getText(currentPage)!, symbols = getSymbols(currentPage)!

    const insertCover = (ins: HTMLDivElement | null) => {
        if (!ins || !isLoaded) return
        
        const cover = <>
            {text.map((t, i) => <TextBox text={t} key={`text-${i}`}/>)}
            {Object.entries(symbols).map(([symbol, matches]) => matches.map((s, i) => <SymbolBox symbol={s} type={symbol} key={`symbol-${symbol}-${i}`} />)).flat()}
        </>

        const canvas = document.getElementsByTagName('canvas')[0]
        const base = canvas.parentElement!
        const node = document.createElement('div')
        base.appendChild(node)

        ReactDOM.render(cover, node)
    }

    //@ts-ignore
    return <div ref={insertCover}><OriginalPdfViewport {...props} /></div>
}

PdfViewport.propTypes = OriginalPdfViewport.propTypes

export default PdfViewport