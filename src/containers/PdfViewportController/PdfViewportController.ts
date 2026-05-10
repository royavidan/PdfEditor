import { useContext, useState } from 'react'

import { FileContext, FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext, Modification, Bloon } from '../../context/modification-context'
import { PDFContext } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'
import { translatePos } from '../../utils'
import { crossIntervals, floatIsEqual, mostCommon } from '../../utils'
import type { PdfMouseEventHandler } from '../../components/PdfRenderer/PdfCanvas'
import type { ControllerProps, Position, Border } from '../../types'
import type { Text, Symbol, SymbolType } from '../../context/pdf-context'
import type { OverlayTemplate } from '../../components/PdfRenderer/Overlay/Overlay'

export interface BasicBloon extends Border {
    text: Text[]
    symbols: Record<SymbolType, Symbol | undefined>
}

type FilledText = Text & Position

function fillBloon(bloon: BasicBloon) {
    const b = bloon as unknown as Bloon
    //STEP 1: read text and find tolerances
    const mainAngle = mostCommon(bloon.text.map(s => s.angle)) ?? 0
    let text = bloon.text.filter(t => floatIsEqual(t.angle, mainAngle, 0.1) || t.plusminus) as FilledText[]
    // text.sort(floatIsEqual(mainAngle, -Math.PI / 2) ? ((a, b) => b.top - a.top) : ((a, b) => a.left - b.left))

    const cosA = Math.cos(mainAngle), sinA = Math.sin(mainAngle)

    text.forEach(t => {
        const x = t.left, y = t.bottom
        t.x = x * cosA + y * sinA
        t.y = -x * sinA + y * cosA
    })

    for (let i = 0; !b.tolerance && i < text.length; i++) {
        for (let j = i + 1; j < text.length; j++) {
            let top = text[i], bottom = text[j]
            if (top.y > bottom.y) [top, bottom] = [bottom, top]

            if (!Number.isNaN(Number(top.str)) && !Number.isNaN(Number(bottom.str)) && crossIntervals([top.x, top.x + top.width], [bottom.x, bottom.x + bottom.width])) {
                const currentText = text
                const indexes = [i, j], plusminus = currentText.map((_, i) => i).filter(i => '+-'.includes(currentText[i].str))
                let topText = top.str, bottomText = bottom.str, match
                const matching = (base: FilledText, t: FilledText) => (base.x - t.x - t.width) < 5 && Math.abs(base.y - t.y) < 5
                if (!'+-'.includes(topText[0]) && topText !== '0' && undefined !== (match = plusminus.find(t => matching(top, currentText[t])))) {
                    if (currentText[match].str === '-') topText = currentText[match].str + topText
                    indexes.push(match)
                }
                if (!'+-'.includes(bottomText[0]) && bottomText !== '0' && undefined !== (match = plusminus.find(t => matching(bottom, currentText[t])))) {
                    if (currentText[match].str === '-') bottomText = currentText[match].str + bottomText
                    indexes.push(match)
                }
                b.tolerance = { '+': topText, '-': bottomText }
                text = text.filter((_, index) => !indexes.includes(index))
                break
            }
        }
    }

    text.sort((a, b) => floatIsEqual(a.x, b.x) ? (b.y - a.y) : (a.x - b.x))
    b.content = text.map(t => t.str).reduce((a, b) => a + (a.endsWith('R') || (/[a-zA-Z-]/.test(b[0]) && b !== 'x') ? ' ' : '') + b, '').trim()
    b.content = b.content.replaceAll('*', '')
    let plusminus = /±([\d.]+)/.exec(b.content)
    if (plusminus) {
        b.tolerance = { '+': plusminus[1], '-': plusminus[1] }
        b.content = (b.content.slice(0, plusminus.index) + b.content.slice(plusminus.index + plusminus[0].length)).trim()
    }

    //STEP 2: find measurement
    b.measurement = (function () {
        const txt = b.content.replaceAll(' ', '')
        const words = b.content.split(/[-\d\s]/)
        let symbol = Object.keys(bloon.symbols).find(sym => sym !== 'dia')
        if (symbol) return symbol.toUpperCase()

        if (txt.endsWith('°')) {
            const m = txt.match(/([\d.]+x)?([\d.]+)°/)
            if (m) {
                const times = m[1] ? Number(m[1].slice(0, -1)) : 1, degrees = Number(m[2])
                return times < 2 && degrees === 45 ? 'CHAMFER' : 'ANGULAR'
            }
        }

        if (words.includes('R')) return 'RADIUS'

        if (['M', 'MF', 'UNC', 'UNF', 'UNEF', 'VNJF', 'G', 'BA', 'BSF', 'H-C', 'Pg', 'TR', 'W', 'Batress'].find(s => words.includes(s)))
            return 'TAP'

        if (txt.startsWith('Ra') || txt.startsWith('Rz') || /^N1?\d/.test(txt)) return 'SURFACE FINISH'

        if (bloon.symbols.dia) return 'DIA'

        return 'LINEAR'
    })()

    b.content = b.content.replace('°°', '°')

    //@ts-ignore
    delete bloon.text
    //@ts-ignore
    delete bloon.symbols

    return b
}

interface PdfViewportControllerData {
  disabled: boolean
  data: FileData
  pageNum: number
  scale: number
  overlayItems: Modification[]
  overlayTemplate: OverlayTemplate
  onMouseUp: PdfMouseEventHandler
  onMouseDown: PdfMouseEventHandler
  onMouseLeave: PdfMouseEventHandler
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  fontSize: number
  markedPosition: Position | null
  onChangeMeasurement(id: number, measurement: string): void
  onPageUp(): void
  onPageDown(): void
}

function PdfViewportController({ children }: ControllerProps<PdfViewportControllerData>) {
  const { data } = useContext(FileContext)
  const { scale, fontSize } = useContext(ViewportContext)
  const { getText, getSymbols, getSize, getAngle, getLoadedPages } = useContext(PDFContext)
  const { counter, incrementCounter, decrementCounter } = useContext(
    CounterContext
  )
  const { modList, addMod, changeMod, removeMod } = useContext(
    ModificationContext
  )
  const [markedPosition, setMarkedPosition] = useState<Position | null>(null)
  const { currentPage, nextPage, prevPage } = useContext(PageContext)

  const isMain = (event: React.MouseEvent) => event.button === 0
  const onMouseDown: PdfMouseEventHandler = (event, position) => isMain(event) && setMarkedPosition(position)
  const onMouseUp: PdfMouseEventHandler = (event, position) => {
    if (!isMain(event) || !markedPosition) return

    const text = getText(currentPage)!, symbols = getSymbols(currentPage)!
    const size = getSize(currentPage), angle = getAngle(currentPage)

    const positions = [markedPosition, position].map(p => translatePos(angle, p.x, p.y, size.width, size.height))
    const X = positions.map(p => p.x / scale), Y = positions.map(p => p.y / scale)
    const bloonInput = {
      left: Math.min(...X),
      right: Math.max(...X),
      top: Math.min(...Y),
      bottom: Math.max(...Y)
    } as BasicBloon
    const isInside = (border: Border) => border.left >= bloonInput.left && border.right <= bloonInput.right && border.top >= bloonInput.top && border.bottom <= bloonInput.bottom
    bloonInput.text = text.filter(t => isInside(t.border))
    bloonInput.symbols = Object.fromEntries(Object.entries(symbols).map(e => [e[0], e[1].find(isInside)]).filter(e => e[1]))
    const bloon = fillBloon(bloonInput)

    addMod({
      position: {
        x: (position.x + scale) / scale,
        y: position.y / scale
      },
      page: currentPage,
      value: counter,
      bloon
    })
    incrementCounter()
    setMarkedPosition(null)
    if (bloon.measurement === 'TAP') {
      addMod({
        position: {
          x: (position.x + scale) / scale + 25,
          y: position.y / scale
        },
        page: currentPage,
        value: counter + 1,
        disabled: true,
        bloon: { ...bloon, measurement: 'DIA' }
      }, 1)
      incrementCounter()
    }
  }
  const onMouseLeave: PdfMouseEventHandler = event => isMain(event) && setMarkedPosition(null)

  return children({
    disabled: getLoadedPages() <= currentPage,
    data: data!,
    pageNum: currentPage + 1,
    scale,
    overlayItems: modList.filter(mod => mod.page === currentPage),
    overlayTemplate: mod => ({
      title: `${mod.bloon.measurement}: ${mod.bloon.content}${mod.bloon.tolerance ? ` (${mod.bloon.tolerance['+']}/${mod.bloon.tolerance['-']})` : ''}`,
      content: `(${mod.value})`
    }),
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onItemMove: (position, id) => {
      changeMod(id, mod => ({
        ...mod,
        position: {
          x: position.x / scale,
          y: position.y / scale
        }
      }))
    },
    onItemDelete: id => {
      const mod = modList.find(mod => mod.id === id)
      if (!mod || mod.disabled) return
      const nextMod = modList.find(mod => mod.value === mod.value + 1)
      removeMod(id)
      decrementCounter()
      if (mod.bloon.measurement === 'TAP') {
        removeMod(nextMod!.id)
        decrementCounter()
      }
    },
    fontSize,
    markedPosition,
    onChangeMeasurement: (id, measurement) => {
      const mod = modList.find(mod => mod.id === id)
      if (!mod || mod.bloon.measurement === measurement) return
      changeMod(id, mod => ({ ...mod, bloon: { ...mod.bloon, measurement } }))

      if (measurement === 'TAP') {
        addMod({
          position: {
            x: mod.position.x + 25,
            y: mod.position.y
          },
          value: mod.value + 1,
          page: currentPage,
          bloon: { ...mod.bloon, measurement: 'DIA' },
          disabled: true
        })
        incrementCounter()
      } else if (mod.bloon.measurement === 'TAP') {
        removeMod(modList.find(mod => mod.value === mod.value + 1)!.id)
        decrementCounter()
      }
    },
    onPageUp: () => prevPage(),
    onPageDown: () => nextPage()
  })
}

export default PdfViewportController
