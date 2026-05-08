import { useContext, useState } from 'react'

import { FileContext, FileData } from '../../context/file-context'
import { ViewportContext } from '../../context/viewport-context'
import { CounterContext } from '../../context/counter-context'
import { ModificationContext, Modification } from '../../context/modification-context'
import { BloonsContext, BasicBloon } from '../../context/bloons-context'
import { PDFContext } from '../../context/pdf-context'
import { PageContext } from '../../context/page-context'
import { translatePos } from '../../utils'
import type { Border, ControllerProps, Position } from '../../types'
import type { PdfMouseEventHandler } from '../../components/PdfRenderer/PdfCanvas'

interface PdfViewportControllerData {
  disabled: boolean
  data: FileData
  pageNum: number
  scale: number
  overlayItems: Modification[]
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
  const { getText, getSymbols, getSize, getAngle, isLoaded } = useContext(PDFContext)
  const { counter, incrementCounter, decrementCounter } = useContext(
    CounterContext
  )
  const { modList, nextId, addMod: addModification, changeMod, removeMod } = useContext(
    ModificationContext
  )
  const { bloons, addBloon, insertBloon, removeBloon, fillBloon, modifyBloon } = useContext(BloonsContext)
  const [markedPosition, setMarkedPosition] = useState<Position | null>(null)
  const { currentPage, nextPage, prevPage } = useContext(PageContext)

  const isMain = (event: React.MouseEvent) => event.button === 0
  const onMouseDown: PdfMouseEventHandler = (event, position) => isMain(event) && setMarkedPosition(position)
  const template = (value: number) => `(${value})`
  const onMouseUp: PdfMouseEventHandler = (event, position) => {
    if (!isMain(event) || !markedPosition) return

    const text = getText(currentPage), symbols = getSymbols(currentPage)
    const size = getSize(currentPage), angle = getAngle(currentPage)

    const id = nextId
    const positions = [markedPosition, position].map(p => translatePos(angle, p.x, p.y, size.width, size.height))
    const X = positions.map(p => p.x / scale), Y = positions.map(p => p.y / scale)
    const bloonInput = {
      id: counter,
      left: Math.min(...X),
      right: Math.max(...X),
      top: Math.min(...Y),
      bottom: Math.max(...Y)
    } as BasicBloon
    const isInside = (border: Border) => border.left >= bloonInput.left && border.right <= bloonInput.right && border.top >= bloonInput.top && border.bottom <= bloonInput.bottom
    bloonInput.text = text!.filter(t => isInside(t.border))
    bloonInput.symbols = Object.fromEntries(Object.entries(symbols!).map(e => [e[0], e[1].find(isInside)]).filter(e => e[1]))

    const bloon = fillBloon(bloonInput)
    addBloon(id, bloon)
    addModification({
      position: {
        x: (position.x + scale) / scale,
        y: position.y / scale
      },
      page: currentPage,
      value: counter,
      title: `${bloon.measurement}: ${bloon.content}${bloon.tolerance ? ` (${bloon.tolerance['+']}/${bloon.tolerance['-']})` : ''}`,
      template
    })
    incrementCounter()
    setMarkedPosition(null)
    if (bloon.measurement === 'TAP') {
      const newBloon = { ...bloon, id: bloon.id + 1, measurement: 'DIA' }
      addBloon(id + 1, newBloon)
      addModification({
        position: {
          x: (position.x + scale) / scale + 25,
          y: position.y / scale
        },
        page: currentPage,
        value: counter + 1,
        disabled: true,
        title: `${newBloon.measurement}: ${newBloon.content}${newBloon.tolerance ? ` (${newBloon.tolerance['+']}/${newBloon.tolerance['-']})` : ''}`,
        template
      }, 1)
      incrementCounter()
    }
  }
  const onMouseLeave: PdfMouseEventHandler = event => isMain(event) && setMarkedPosition(null)

  return children({
    disabled: !isLoaded(),
    data: data!,
    pageNum: currentPage + 1,
    scale,
    overlayItems: modList.filter(mod => mod.page === currentPage),
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
      if (modList.find(mod => mod.id === id)!.disabled) return
      const originalBloon = bloons[id]
      const idToRemove = Number(Object.entries(bloons).find(e => e[1].id === originalBloon.id + 1)?.[0])
      removeMod(id)
      removeBloon(id)
      decrementCounter()
      if (originalBloon.measurement === 'TAP') {
        removeMod(idToRemove)
        removeBloon(idToRemove)
        decrementCounter()
      }
    },
    fontSize,
    markedPosition,
    onChangeMeasurement: (id, measurement) => {
      const originalMeasurement = bloons[id].measurement
      if (measurement === originalMeasurement) return
      modifyBloon(id, { measurement })
      changeMod(id, mod => {
        mod.title = measurement + mod.title.slice(mod.title.indexOf(':'))
        return mod
      })

      if (measurement === 'TAP') {
        const value = bloons[id].id + 1
        const newBloon = { ...bloons[id], id: value, measurement: 'DIA' }
        insertBloon(nextId, newBloon)
        addModification({
          position: {
            x: modList.find(mod => mod.id === id)!.position.x + 25,
            y: modList.find(mod => mod.id === id)!.position.y
          },
          value,
          page: currentPage,
          disabled: true,
          title: `${newBloon.measurement}: ${newBloon.content}${newBloon.tolerance ? ` (${newBloon.tolerance['+']}/${newBloon.tolerance['-']})` : ''}`,
          template
        })
        incrementCounter()
      } else if (originalMeasurement === 'TAP') {
        const idToRemove = Number(Object.entries(bloons).find(e => e[1].id === bloons[id].id + 1)![0])
        removeMod(idToRemove)
        removeBloon(idToRemove)
        decrementCounter()
      }
    },
    onPageUp: () => prevPage(),
    onPageDown: () => nextPage()
  })
}

export default PdfViewportController
