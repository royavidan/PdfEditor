import { useContext, useState } from 'react'

import { FileContext, type FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext, type Modification } from '../../context/modification-context'
import { PDFContext } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'
import { translatePos } from '../../utils'
import { fillBloon } from './bloons-logic'
import { SettingsContext } from '../../context/settings-context'
import type { PdfMouseEventHandler } from '../../components/PdfRenderer/PdfCanvas'
import type { ControllerProps, Position } from '../../types'
import type { OverlayTemplate } from '../../components/PdfRenderer/Overlay/Overlay'

interface PdfViewportControllerData {
  disabled: boolean
  data: FileData
  pageNum: number
  scale: number
  minValue: number
  maxValue: number
  overlayItems: Modification[]
  overlayTemplate: OverlayTemplate
  onMouseUp: PdfMouseEventHandler
  onMouseDown: PdfMouseEventHandler
  onMouseLeave: PdfMouseEventHandler
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  fontSize: number
  markedPosition: Position | null
  onChangeValue(id: number, value: number): void
  onChangeContent(id: number): void
  onChangeMeasurement(id: number, measurement: string): void
  onPageUp(): void
  onPageDown(): void
}

function PdfViewportController({ children }: ControllerProps<PdfViewportControllerData>) {
  const { data } = useContext(FileContext)
  const { scale } = useContext(ViewportContext)
  const { fontSize, doubleBloonsOnTap, initialCounter } = useContext(SettingsContext)
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
    }
    const bloon = fillBloon(bloonInput, { text, symbols })
    const hasExtra = doubleBloonsOnTap && bloon.measurement === 'TAP'
    
    addMod({
      position: {
        x: (position.x + scale) / scale,
        y: position.y / scale
      },
      page: currentPage,
      value: counter,
      hasExtra,
      bloon
    })
    incrementCounter()
    setMarkedPosition(null)
    if (hasExtra) {
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
    minValue: initialCounter,
    maxValue: counter - 1,
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
      const mod = modList.find(m => m.id === id)
      if (!mod || mod.disabled) return
      const nextMod = modList.find(m => m.value === mod.value + 1)
      removeMod(id)
      decrementCounter()
      if (mod.hasExtra) {
        removeMod(nextMod!.id)
        decrementCounter()
      }
    },
    fontSize,
    markedPosition,
    onChangeValue: (id, value) => {
      const mod = modList.find(mod => mod.id === id)!
      const nextMod = modList.find(mod => mod.value === mod.value + 1)
      removeMod(mod.id)
      mod.value = value
      addMod(mod)
      if (mod.bloon.measurement === 'TAP') {
        removeMod(nextMod!.id)
        nextMod!.value = value + 1
        addMod(nextMod!)
      }
    },
    onChangeContent: id => {
      const mod = modList.find(mod => mod.id === id)!
      const content = prompt('Change content', mod.bloon.content)
      if (content !== null) {
        changeMod(id, mod => ({ ...mod, bloon: { ...mod.bloon, content } }))
      }
    },
    onChangeMeasurement: (id, measurement) => {
      const mod = modList.find(mod => mod.id === id)
      if (!mod || mod.bloon.measurement === measurement) return
      changeMod(id, mod => ({ ...mod, bloon: { ...mod.bloon, measurement } }))

      if (doubleBloonsOnTap && measurement === 'TAP') {
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
        changeMod(id, mod => ({ ...mod, hasExtra: true }))
        incrementCounter()
      } else if (mod.hasExtra) {
        removeMod(modList.find(mod => mod.value === mod.value + 1)!.id)
        changeMod(id, mod => ({ ...mod, hasExtra: false }))
        decrementCounter()
      }
    },
    onPageUp: () => prevPage(),
    onPageDown: () => nextPage()
  })
}

export default PdfViewportController
