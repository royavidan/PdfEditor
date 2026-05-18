import { useContext, useState } from 'react'

import { FileContext, FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext, Modification } from '../../context/modification-context'
import { PDFContext } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'
import { translatePos } from '../../utils'
import { fillBloon } from './bloons-logic'
import type { PdfMouseEventHandler } from '../../components/PdfRenderer/PdfCanvas'
import type { ControllerProps, Position } from '../../types'
import type { OverlayTemplate } from '../../components/PdfRenderer/Overlay/Overlay'

const ANGLE_DELTA = Math.PI / 48

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
  onWheel(e: WheelEvent): void
  onItemMove(position: Position, id: number): void
  onItemDelete(id: number): void
  fontSize: number
  markedPosition: Position | null
  angle: number
  onChangeContent(id: number): void
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
  const [boxAngle, setBoxAngle] = useState(0)
  const { currentPage, nextPage, prevPage } = useContext(PageContext)

  const isMain = (event: React.MouseEvent) => event.button === 0
  const onMouseDown: PdfMouseEventHandler = (event, position) => {
    setBoxAngle(0)
    if (isMain(event)) setMarkedPosition(position)
  }
  const onMouseUp: PdfMouseEventHandler = (event, position) => {
    if (!isMain(event) || !markedPosition) return

    const text = getText(currentPage)!, symbols = getSymbols(currentPage)!
    const size = getSize(currentPage), angle = getAngle(currentPage)

    const positions = [markedPosition, position].map(p => translatePos(angle, p.x, p.y, size.width, size.height))
    const bloon = fillBloon({ diagonal: positions.map(p => ({ x: p.x / scale, y: p.y / scale })) as [Position, Position], angle: boxAngle }, { text, symbols })

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
    setBoxAngle(0)
  }
  const onMouseLeave: PdfMouseEventHandler = event => {
    setBoxAngle(0)
    if (isMain(event)) setMarkedPosition(null)
  }

  const onWheel = (e: WheelEvent) => {
    if (e.buttons & 1) {
      e.preventDefault()
      e.stopPropagation()
      if (e.deltaY > 0) setBoxAngle(angle => angle + ANGLE_DELTA)
      else setBoxAngle(angle => angle - ANGLE_DELTA)
    }
  }

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
    onWheel,
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
    angle: boxAngle,
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
